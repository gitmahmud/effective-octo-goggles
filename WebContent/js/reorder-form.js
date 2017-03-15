/**
 * Created by rahman_ma-pc on 3/15/2017.
 */
let stockId = parseInt($.url().param('id'));


var stock = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.maxusage, stock.leadtime , stock.avgdailyusage , stock.maxleadtime, stock.balance, item.pclass \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.id = ?', [stockId])[0];

$('#reorder_form_name').text(stock.code)
$('#reorder_form_detail').text(stock.detail);
$('#reorder_form_quantity').text(stock.balance);
$('#reorder_form_max_daily_usage').text(stock.maxusage);
$('#reorder_form_lead_time').text(stock.leadtime);
let safetyStock = stock.maxusage * stock.maxleadtime - stock.avgdailyusage * stock.leadtime;
$('#reorder_form_safety_stock').text(safetyStock);


plotSalesHistoryChart();

plotDemandForecastChart(getDefaultStartDate(), getDefaultEndDate());
$('#totalOrderQuantity').val(safetyStock + parseInt($('#totalForecastQuantity').val()));

$('#startDate,#endDate').on('change', function () {
    let start = $('#startDate').val() || getDefaultStartDate();
    let end = $('#endDate').val() || getDefaultEndDate();
    console.log(start , end);

    plotDemandForecastChart(start , end);
    $('#totalOrderQuantity').val(safetyStock + parseInt($('#totalForecastQuantity').val()));


});
$('#totalOrderQuantity').on('keyup' , function () {
    console.log('OK'+$('#reorder_form_safety_stock').val()+$('#totalOrderQuantity').val());
    if(parseInt($('#reorder_form_safety_stock').text()) > parseInt($('#totalOrderQuantity').val()) ){

        $('#reorder_form_safety_stock').css('background' , 'red');
    }
    else
    {
        $('#reorder_form_safety_stock').css('background' , '');

    }
});



function plotSalesHistoryChart() {
    let saleData = [];

    let s = alasql('SELECT * from trans where stock=1 and memo="Sold"');

    for (let i = 0; i < s.length; i++) {
        let arr = s[i]["date"].split("-");
        saleData.push([Date.UTC(parseInt(arr[0]), parseInt(arr[1] - 1), parseInt(arr[2])), Math.abs(s[i]["qty"])])

    }
    Highcharts.chart('salesHistoryChart', {

        title: {
            text: 'Sales History'
        },
        xAxis: {
            type: 'datetime'
        },

        yAxis: {
            title: {
                text: 'Sales quantity'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },

        series: [{
            name: 'Sales',
            data: saleData
        }

        ]

    });
}

function plotDemandForecastChart(startDate, endDate) {
    let forecastData = [];

    console.log(startDate + endDate)
    let s = alasql('SELECT * from forecast where times >= ? and times <= ? and stockid = ?', [startDate, endDate, stock.id]);
    console.log('s ', s)

    for (let i = 0; i < s.length; i++) {
        let arr = s[i]["times"].split("-");
        forecastData.push([Date.UTC(parseInt(arr[0]), parseInt(arr[1] - 1), parseInt(arr[2])), Math.abs(s[i]["quantity"])]);

    }


    Highcharts.chart('demandForecastChart', {

        title: {
            text: 'Demand Forecast'
        },
        xAxis: {
            type: 'datetime'
        },

        yAxis: {
            title: {
                text: 'Demand quantity'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },

        series: [{
            name: 'Demand',
            data: forecastData
        }

        ]

    });


    $('#startDate').val(startDate);
    $('#endDate').val(endDate);

    let sum = 0 ;

    for(let i = 0;i<forecastData.length ; i++)
    {
        sum += forecastData[i][1];

    }

    $('#totalForecastQuantity').val(sum);
    $('#totalDaysForecast').text(forecastData.length);





}

function getDefaultStartDate() {
    let currentDate = new Date();
    return currentDate.getFullYear() + '-' + (currentDate.getMonth() >= 9 ? '' : '0') + (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() >= 9 ? '' : '0') + currentDate.getDate();


}
function getDefaultEndDate() {
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 15);
    return currentDate.getFullYear() + '-' + (currentDate.getMonth() >= 9 ? '' : '0') + (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() >= 9 ? '' : '0') + currentDate.getDate();

}

function orderPressed() {


    let arr = alasql('SELECT * from supplier where whouseid = 1;');
    let str = '';
    for(let i = 0; i < arr.length ; i++)
    {
        let rating = alasql('SELECT * from supplierrating where supplierid=?;',[ arr[i]["id"]] )[0]["rating"];
        str+= '<tr>'+
                '<td><input type="radio"> </td>'+
                '<td>'+arr[i]["name"]+'</td>'+
                '<td>'+rating+'</td>'

            +'</tr>'

    }

    $('#modalSelectSupplier').show();


}