/**
 * Created by rahman_ma-pc on 3/15/2017.
 */
let stockId = parseInt($.url().param('id'));

var today = localStorage.getItem('today');
var backorders = getBackorder();


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
let imageItemId = alasql('SELECT item from stock where id=2 ')[0]['item'];
$('#img_product_reorder_form').attr('src', 'img/' + imageItemId + '.jpg');

$('#total_pending_backorder').text(backorders['total']);
$('#final_backorder_quantity').text(backorders['qty']);


plotSalesHistoryChart();

plotDemandForecastChart(today, getDatefromMS(getMSFromDate(today) + 7 * 24 * 60 * 60 * 1000));
displayFinalOrderTable();

$('#startDate,#endDate').on('change', function () {
    let start = $('#startDate').val() || today;
    let end = $('#endDate').val() || getDatefromMS(getMSFromDate(today) + 7 * 24 * 60 * 60 * 1000);
    console.log(start, end);

    plotDemandForecastChart(start, end);
    displayFinalOrderTable();


});
$('#totalOrderQuantity').on('keyup', onTotalOrderQuantityChange);
$('#totalForecastQuantity').on('change' , displayFinalOrderTable);

function displayFinalOrderTable(){
    let totalSafetyStock = parseInt($('#reorder_form_safety_stock').text());
    let totalForecastQty = parseInt($('#totalForecastQuantity').val());
    $('#final_demand_quantity').text(totalForecastQty);
    $('#final_backorder_quantity').text(backorders.qty);

    let totalOrderQty = totalForecastQty + totalSafetyStock + backorders.qty;

    $('#totalOrderQuantity').val(totalOrderQty);

}

function onTotalOrderQuantityChange() {


    if (parseInt($('#reorder_form_safety_stock').text()) > parseInt($('#totalOrderQuantity').val())) {

        $('#reorder_form_safety_stock').css('background', 'red');
    }
    else {
        $('#reorder_form_safety_stock').css('background', '');

    }

    if(parseInt($('#totalOrderQuantity').val()) <backorders.qty)
    {
        alert('You can not order less than backorder quantity');
        $('#totalOrderQuantity').val(backorders.qty);

    }



}



var supplierRatingArray = createSupplierArray();


function plotSalesHistoryChart() {
    let saleData = [];

    let s = alasql('SELECT * from trans where stock=? and memo="Sold"', [stockId]);


    for (let i = 0; i < s.length; i++) {
        let arr = s[i]["date"].split("-");
        saleData.push([Date.UTC(parseInt(arr[0]), parseInt(arr[1] - 1), parseInt(arr[2])), Math.abs(s[i]["qty"])])

    }


    Highcharts.chart('salesHistoryChart', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Sales History'
        },
        xAxis: {
            type: 'datetime',
            labels: {
                // rotation: -45,
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Sales quantity'
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            pointFormat: 'Sale quantity: <b>{point.y}</b> .'
        },
        series: [{
            name: 'saleData',
            data: saleData,
            dataLabels: {
                enabled: true,
                rotation: 0,
                color: '#FFFFFF',
                align: 'center',
                format: '{point.y}', // one decimal
                y: 10, // 10 pixels down from the top
                style: {
                    //fontSize: '12px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        }]
    });

    let totalSell = 0;

    saleData.forEach(function (sdata, index) {
        totalSell += sdata[1];
    });
    $('#totalSellHistory').text(totalSell);

    // console.log(s[s.length -1]['date']);

    $('#last_sell_date_reorder_form').text(s[s.length - 1]['date']);

    let t = alasql('SELECT last(date) AS last_date , last(qty) AS last_qty from trans where memo="Purchased" and stock=?', [stockId])[0];
    // console.log(t['last_date'],'t');
    $('#last_purchase_date_reorder_form').html(t['last_date']);
    $('#last_purchase_quantity_reorder_form').html(t['last_qty']);


    // Highcharts.chart('salesHistoryChart', {
    //
    //     title: {
    //         text: 'Sales History'
    //     },
    //     xAxis: {
    //         type: 'datetime'
    //     },
    //
    //     yAxis: {
    //         title: {
    //             text: 'Sales quantity'
    //         }
    //     },
    //     legend: {
    //         layout: 'vertical',
    //         align: 'right',
    //         verticalAlign: 'middle'
    //     },
    //
    //     series: [{
    //         name: 'Sales',
    //         data: saleData
    //     }
    //
    //     ]
    //
    // });
}

function plotDemandForecastChart(startDate, endDate) {
    let allForecastData = {};
    let forecastSeries = [];
    let demandSum = 0;

    console.log(startDate + endDate)
    let s = alasql('SELECT * from forecast where times >= ? and times <= ? and stockid = ?', [startDate, endDate, stock.id]);
    console.log('s ', s);


    for (let i = 0; i < s.length; i++) {
        let arr = s[i]["times"].split("-");
        demandSum += s[i]["quantity"];

        if (!allForecastData.hasOwnProperty(s[i]["type"])) {
            allForecastData[s[i]["type"]] = [];
        }

        allForecastData[s[i]["type"]].push([Date.UTC(parseInt(arr[0]), parseInt(arr[1] - 1), parseInt(arr[2])), Math.abs(s[i]["quantity"])]);


    }

    for (let key in allForecastData) {
        if (allForecastData.hasOwnProperty(key)) {
            let d = {};

            d["name"] = key;
            d["data"] = allForecastData[key];
            d["dataLabels"] = {
                enabled: true,
                rotation: 0,
                color: '#FFFFFF',
                align: 'center',
                format: '{point.y}', // one decimal
                y: 10, // 10 pixels down from the top
                style: {
                    //fontSize: '12px',
                    fontFamily: 'Verdana, sans-serif'
                }
            };

            forecastSeries.push(d);
        }

    }

    Highcharts.chart('demandForecastChart', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Demand Forecast'
        },
        xAxis: {
            type: 'datetime',
            tickInterval: 24 * 3600 * 1000,
            labels: {
                // rotation: -45,
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Demand quantity'
            }
        },
        legend: {
            enabled: true
        },
        tooltip: {
            pointFormat: 'Demand quantity: <b>{point.y}</b> .'
        },
        series: forecastSeries
    });


    // Highcharts.chart('demandForecastChart', {
    //
    //     title: {
    //         text: 'Demand Forecast'
    //     },
    //     xAxis: {
    //         type: 'datetime'
    //     },
    //
    //     yAxis: {
    //         title: {
    //             text: 'Demand quantity'
    //         }
    //     },
    //     legend: {
    //         layout: 'vertical',
    //         align: 'right',
    //         verticalAlign: 'middle'
    //     },
    //
    //     series: [{
    //         name: 'Demand',
    //         data: forecastSeries
    //     }
    //
    //     ]
    //
    // });


    $('#startDate').val(startDate);
    $('#endDate').val(endDate);


    $('#totalForecastQuantity').val(demandSum);
    $('#totalDaysForecast').text(s.length);


}
function getBackorder() {
    let backorderQuantity = 0;
    let backorders = 0;

    let allBackorders = alasql('SELECT * from customerorder where isbackorder = 2');

    for (let i = 0; i < allBackorders.length; i++) {
        if (allBackorders[i]['type'] === 'stock' && allBackorders[i]['tid'] === stockId) {
            backorders += 1;
            backorderQuantity += allBackorders[i]['quantity'];

        }

        if (allBackorders[i]['type'] === 'bundle') {
            let allBundleItems = alasql("SELECT * from bundleitems where pbid = ? ", [allBackorders[i]['tid']]);

            allBundleItems.forEach(function (it, index) {
                if (it['stockid'] === stockId) {
                    backorders += 1;
                    backorderQuantity += allBackorders[i]['quantity'] * it['quantity'];
                }
            });
        }
        if (allBackorders[i]['type'] === 'free') {
            let freeProduct = alasql('SELECT * from promotionfree where id= ?',
                [allBackorders[i]['tid']])[0];

            let promotionMasterDetails = alasql('SELECT * from promotionmaster where id= ?',
                [freeProduct['pmid']])[0];


            if (freeProduct['originalstockid'] === stockId) {
                backorders += 1;
                backorderQuantity += allBackorders[i]['quantity'] * freeProduct['quantity'];

            }

            if (promotionMasterDetails['obsoletestockid'] === stockId) {
                backorders += 1;
                backorderQuantity += allBackorders[i]['quantity'];

            }


        }


    }

    return {
        'total': backorders,
        'qty': backorderQuantity
    };


}


function getDatefromMS(currentDate) {
    currentDate = new Date(currentDate);
    return currentDate.getFullYear() + '-' + (currentDate.getMonth() >= 9 ? '' : '0') + (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() >= 9 ? '' : '0') + currentDate.getDate();


}
function getMSFromDate(currentDate) {
    let arr = currentDate.split('-');
    let d = Date.UTC(parseInt(arr[0]), parseInt(arr[1]) - 1, parseInt(arr[2]));

    return d;

}


function createSupplierArray() {
    let arr = alasql('SELECT * from supplier where whouseid = 1;');
    let ret = [];

    for (let i = 0; i < arr.length; i++) {
        let rating = alasql('SELECT AVG(rating) AS avg_rating,last(rating) AS last_rating  from supplierrating where supplierid=? group by supplierid;', [arr[i]["id"]])[0];
        rating["name"] = arr[i]["name"];
        rating["id"] = arr[i]["id"];


        ret.push(rating);
    }

    return ret;

}

function orderPressed() {
    createSupplierModalData();
    $('#modalSelectSupplier').modal('show');

}

function createSupplierModalData() {

    let str = '';

    for (let i = 0; i < supplierRatingArray.length; i++) {

        str += '<tr>' +
            '<td><input type="radio" id="select_supplier_radio_' + supplierRatingArray[i]["id"] + '" name="supplierselection" > </td>' +
            '<td>' + supplierRatingArray[i]["name"] + '</td>' +
            '<td>' + supplierRatingArray[i]["avg_rating"].toFixed(2) + '</td>' +
            '<td>' + supplierRatingArray[i]["last_rating"] + '</td>' + +'</tr>'

    }
    $('#tbody_choose_supplier').html(str);


}
function supplierSelected() {
    $('#modalSelectSupplier').modal('hide');
    let arr = $('input[name="supplierselection"]').filter(':checked').attr('id').split('_');

    let supplierid = parseInt(arr[arr.length - 1]);
    let rpid = alasql('SELECT MAX(id) AS max_id from reorderproduct')[0]['max_id'];
    rpid = rpid === undefined ? 100 : rpid + 1;
    let orderquantity = $('#totalOrderQuantity').val();
    let orderplacedDate = getDatefromMS(new Date());
    let expectedReceiveDate = getDatefromMS(new Date().setDate(new Date().getDate() + stock.leadtime));


    alasql('INSERT INTO reorderproduct VALUES(?,?,?,?,?,?,?,?,?,?,?)',
        [rpid, stockId, supplierid, 'ORDER PLACED', orderquantity, orderplacedDate, '', expectedReceiveDate, 0, 0, 0]);
    alasql('UPDATE stock SET reorderstatus = 2 where id = ?', [stockId]);

    let supplierName = alasql('SELECT name from supplier where id=?', [supplierid])[0]['name'];

    let str = '<tr>' +
        '<th>Order ID : </th>' +
        '<td>#' + rpid + '</td></tr>' +
        '<tr><th>Product name : </th>' +
        '<td>' + stock.code + '</td></tr>' +
        '<tr><th>Detail :  </th>' +
        '<td>' + stock.detail + '</td></tr>' +
        '<tr><th>Existing quantity :   </th>' +
        '<td>' + stock.balance + '</td></tr>' +
        '<tr><th>Ordered quantity :   </th>' +
        '<td>' + orderquantity + '</td></tr>' +
        '<tr><th>Supplier :   </th>' +
        '<td>' + supplierName + '</td></tr>' +
        '<tr><th>Order Date :   </th>' +
        '<td>' + orderplacedDate + '</td></tr>' +
        '<tr><th>Expected order arrival date :   </th>' +
        '<td>' + expectedReceiveDate + '</td></tr>';


    $('#tbody_order_receipt').html(str);
    $('#modalOrderReceipt').modal('show');


}


$('#id_supplier_rating_btn_asc').on('click', function () {
    supplierRatingArray.sort(function (a, b) {
        let cmp = a.avg_rating - b.avg_rating;
        return cmp === 0 ? b.last_rating - a.last_rating : cmp;
    });

    createSupplierModalData();

});
$('#id_supplier_rating_btn_desc').on('click', function () {
    supplierRatingArray.sort(function (a, b) {
        let cmp = -a.avg_rating + b.avg_rating;
        return cmp === 0 ? b.last_rating - a.last_rating : cmp;
    });
    createSupplierModalData();

});

