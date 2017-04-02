/**
 * Created by rahman_ma-pc on 3/24/2017.
 */
let stockId = parseInt($.url().param('id'));
console.log(stockId);

var today = localStorage.getItem("today");

var promotionMasterDetails = alasql('SELECT * from promotionmaster where obsoletestockid = ? and enddate = ""', [stockId])[0];

var stockDetails = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.maxusage, stock.leadtime , stock.avgdailyusage , stock.maxleadtime, stock.balance, item.pclass \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.id = ?', [stockId])[0];


$('#promotion_details_name').text(stockDetails.code);
$('#promotion_details_product_detail').text(stockDetails.detail);
$('#promotion_details_price').text(stockDetails.price);
$('#promotion_details_quantity').text(stockDetails.balance);
$('#promotion_details_current_promotion').text(promotionMasterDetails.type);



plotSaleComparisonChart();

var promotionHistory = alasql('SELECT * from promotionmaster where obsoletestockid = ? and enddate != "" ',
    [stockId]);

let str = '';
for(let i = 0 ; i < promotionHistory.length ; i++)
{
    let sold_quant = Math.abs(alasql('SELECT sum(qty) AS sum_sold from trans where stock = ? and date >= ? and date <= ? and memo = "Sold" ',
    [stockId , promotionHistory[i]["startdate"] , promotionHistory[i]["enddate"] ])[0]["sum_sold"]);

    let dayTotal = alasql('SELECT count(*) AS day_count from forecast where stockid = ? and times >= ? and times <= ? ',
    [stockId , promotionHistory[i]["startdate"] , promotionHistory[i]["enddate"]  ])[0]["day_count"];


    str += '<tr>'+
            '<td class="text-capitalize">'+ promotionHistory[i]["type"]+'</td>'+
            '<td>'+ promotionHistory[i]["startdate"]+'</td>'+
            '<td>'+ promotionHistory[i]["enddate"]+'</td>'+
            '<td>'+ dayTotal+'</td>'+
            '<td>'+ sold_quant+'</td>'+
            '</tr>';


}

$('#tbody_promotion_history').html(str);


function plotSaleComparisonChart() {
    let chartSeries = [];
    let foreCastQtySum = 0 ;
    let actualQtySum = 0;

    console.log(stockId , promotionMasterDetails.multiplier , promotionMasterDetails.startdate , today );
    let forecastData = alasql('SELECT times , quantity * ? AS forecast_quantity from forecast where stockid = ? and times >= ? and times <= ? order by times asc',
        [promotionMasterDetails.multiplier  , stockId  , promotionMasterDetails.startdate , today ]);
    let forecastSeries = [];
    console.log(forecastData);

    forecastData.forEach(function (data , index) {
        let arr = data["times"].split('-');

        forecastSeries.push([Date.UTC(parseInt(arr[0]) , parseInt(arr[1]) -1 , parseInt(arr[2]) ) ,
            Math.round(data["forecast_quantity"]) ]);
        foreCastQtySum +=  Math.round(data["forecast_quantity"]);


    });

    let actualSale = alasql('SELECT sum(qty) AS qty ,date from trans where memo="Sold" and stock= ? and date >= ? and date <= ? group by date order by date asc ',
    [stockId , promotionMasterDetails.startdate , today]);

    let actualSeries = [];




    actualSale.forEach(function (data,index) {
        let arr = data["date"].split('-');
        actualSeries.push([Date.UTC(parseInt(arr[0]) , parseInt(arr[1]) -1 , parseInt(arr[2]) ) ,
            Math.abs(parseInt(data["qty"])) ]);

        actualQtySum +=  Math.abs(parseInt(data["qty"]));


    });

    console.log(actualSale);



    // console.log(forecastSeries);





    chartSeries[0] = {
        name: "Forecasted sale",
        data: forecastSeries
    };
    chartSeries[1] = {
        name: "Actual sale",
        data: actualSeries

    };


    $('#promotion_details_promotion_start').text(promotionMasterDetails.startdate);
    $('#promotion_details_total_day').text(forecastSeries.length+' day');
    $('#promotion_details_total_forecasted_sale').text(foreCastQtySum);
    $('#promotion_details_total_actual_sale').text(actualQtySum);
    if(actualQtySum > foreCastQtySum){
        $('#promotion_details_sale_difference').html('<label class="label label-success"  style="font-size: large">'+ (actualQtySum-foreCastQtySum) +' pcs more sell </label>');
    }
    else if(actualQtySum === foreCastQtySum)
    {
        $('#promotion_details_sale_difference').html('<label class="label label-primary"  style="font-size: large"> Equal sale </label>');
    }
    else
    {
        $('#promotion_details_sale_difference').html('<label class="label label-warning" style="font-size: large"> '+ (foreCastQtySum - actualQtySum) +' pcs less sale  </label>');

    }


    Highcharts.chart('saleComparisonChart', {
        chart:{
            type: 'line'

        },

        title: {
            text: 'Forecast sale vs actual sale'
        },

        subtitle: {
            text: ''
        },
        xAxis: {
            type: 'datetime'
        },

        yAxis: {
            title: {
                text: 'Quantity'
            }
        },
        plotOptions:{
            line:{
                dataLabels:{
                    enabled : true
                },
                enableMouseTracking : false
            }

        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle'
        },

//            plotOptions: {
//                series: {
//                    //pointStart: 2010
//                    //type: 'datetime',
//                    categories: ['2017-02-10', '2017-02-11', '2017-02-12',
//                        '2017-02-13','2017-02-14' , '2017-02-15' ,
//                        '2017-02-16' , '2017-02-17'
//                    ]
//                }
//            },

        series: chartSeries

    });


}

function onPromotionChangeClicked() {
    alasql('UPDATE promotionmaster SET enddate = ? where id = ? ',[today , promotionMasterDetails.id]);
    window.location.replace('new-promotion.html?id='+stockId);

}
function onPromotionCancelClicked() {
    alasql('UPDATE promotionmaster SET enddate = ? where id = ? ',[today , promotionMasterDetails.id]);
    alasql('UPDATE stock SET isobsolete = 0 where id = ? ',[stockId]);
    window.location.replace('index.html?inv=1');
}

function onClickReturnToSupplier() {

    window.location.replace('product-return-form.html?q1=obsolete&q2='+stockId);

}

