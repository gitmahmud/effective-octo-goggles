/**
 * Created by rahman_ma-pc on 3/21/2017.
 */
var today = localStorage.getItem('today');

var newObsoleteProducts = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.balance, item.pclass, stock.obsoleteperiod ,item.id AS itemid \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.isobsolete = 1');

for(let i = 0 ; i < newObsoleteProducts.length ; i++)
{
    let last_sale_date = alasql('SELECT last(date) AS last_sale from trans where  memo = "Sold"  and stock = ?', [newObsoleteProducts[i]["id"]])[0]["last_sale"];
    newObsoleteProducts[i]["last_sale_date"] =  last_sale_date === undefined ? '' : last_sale_date ;


    newObsoleteProducts[i]["last_buy_date"] = alasql('SELECT last(date) AS last_buy from trans where \
        (memo = "Purchased" or memo = "Initial Stock") and stock = ?', [newObsoleteProducts[i]["id"]])[0]["last_buy"];

}
var markedObsolete ;


displayNewObsoleteProducts();
$('#id_new_obsolete_list_last_sold_desc').on('click',function () {
    newObsoleteProducts.sort(function (a, b) {
        let cmp = b.last_sale_date.localeCompare(a.last_sale_date);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayNewObsoleteProducts();


});

$('#id_new_obsolete_list_last_sold_asc').on('click',function () {
    newObsoleteProducts.sort(function (a, b) {
        let cmp = a.last_sale_date.localeCompare(b.last_sale_date);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayNewObsoleteProducts();


});

$('#id_new_obsolete_list_remaining_desc').on('click',function () {
    newObsoleteProducts.sort(function (a, b) {
        let cmp = -a.balance + b.balance ;
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayNewObsoleteProducts();


});

$('#id_new_obsolete_list_remaining_asc').on('click',function () {
    newObsoleteProducts.sort(function (a, b) {
        let cmp = a.balance - b.balance ;
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayNewObsoleteProducts();

});

$('#id_new_obsolete_list_price_desc').on('click',function () {
    newObsoleteProducts.sort(function (a, b) {
        let cmp = -a.price + b.price ;
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayNewObsoleteProducts();


});

$('#id_new_obsolete_list_price_asc').on('click',function () {
    newObsoleteProducts.sort(function (a, b) {
        let cmp = a.price - b.price ;
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayNewObsoleteProducts();

});

$("button[id^='obsolete_report_']").on('click' , function () {
    let arr = $(this).attr('id').split('_');
    let stockId = parseInt(arr[arr.length - 1]);
    let selectedObsoleteItem = newObsoleteProducts.find(function (currentProduct) {
        return currentProduct.id === stockId;
    });
    markedObsolete = selectedObsoleteItem;
    

    $('#obsolete_report_stock_id').text(selectedObsoleteItem.id);
    $('#obsolete_report_name').text(selectedObsoleteItem.code);
    $('#obsolete_report_maker').text(selectedObsoleteItem.maker);
    $('#obsolete_report_detail').text(selectedObsoleteItem.detail);
    $('#obsolete_report_period').text(selectedObsoleteItem.obsoleteperiod);
    $('#obsolete_report_last_sold').text(selectedObsoleteItem.last_sale_date);
    $('#obsolete_report_last_buy').text(selectedObsoleteItem.last_buy_date);
    $('#obsolete_report_price').text(selectedObsoleteItem.price);
    $('#obsolete_report_quantity').text(selectedObsoleteItem.balance);
    $('#obsolete_report_pclass').text(selectedObsoleteItem.pclass);
    $('#obsolete_report_img').attr('src','img/'+selectedObsoleteItem.id+'.jpg' );


    plotProductTransactionHistoryChart(stockId);

    $('#modalObsoleteReport').modal('show');


});





function displayNewObsoleteProducts() {

    let str = '';

    for(let i = 0;i<newObsoleteProducts.length ; i++)
    {
        let currentProduct = newObsoleteProducts[i];

        str += '<tr>'+
            '<td><img style="width: 150px;" src="img/'+ currentProduct.itemid +'.jpg"</td>'+
                '<td>'+ currentProduct.code +'</td>'+
                '<td>'+ currentProduct.maker+'</td>'+
                '<td>'+ currentProduct.detail+'</td>'+
                '<td>'+ currentProduct.last_sale_date+'</td>'+
                '<td>'+ currentProduct.balance+'</td>'+
                '<td>'+ currentProduct.price+'</td>'+
                '<td><button class="btn btn-primary" id="obsolete_report_'+ currentProduct.id+'">See Report</button></td></tr>';

    }

    $('#tbody_new_obsolete').html(str);






}
function plotProductTransactionHistoryChart(stockId) {

    let productTransData = {};
    let productHistorySeries = [];

    let s = alasql('SELECT * from trans where stock=? ',[stockId]);

    for (let i = 0; i < s.length; i++) {
        let arr = s[i]["date"].split("-");


        if(!productTransData.hasOwnProperty(s[i]["memo"]))
        {
            productTransData[s[i]["memo"]] = [];
        }

        productTransData[s[i]["memo"]].push([Date.UTC(parseInt(arr[0]), parseInt(arr[1] - 1), parseInt(arr[2])), Math.abs(s[i]["qty"])]);


    }
    console.log(productTransData);

    for(let key in productTransData)
    {
        if(productTransData.hasOwnProperty(key))
        {
            let d = {};

            d["name"] = key;
            d["data"] = productTransData[key];
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

            productHistorySeries.push(d);
        }

    }



    Highcharts.chart('productTransactionHistory', {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Product History'
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
                text: 'Quantity'
            }
        },
        legend: {
            enabled: true
        },
        tooltip: {
            pointFormat: 'Quantity: <b>{point.y}</b> .'
        },
        series: productHistorySeries
    });

}
function productMarkedAsObsolete() {

    $('#modalObsoleteReport').modal('hide');
    alasql('UPDATE stock SET isobsolete = 2 where id = ?',[markedObsolete.id]);

    $('#obsolete_count_stock_id').text(markedObsolete.id);
    $('#obsolete_count_name').text(markedObsolete.code);
    $('#obsolete_count_maker').text(markedObsolete.maker);
    $('#obsolete_count_detail').text(markedObsolete.detail);
    $('#obsolete_count_total_expected').text(markedObsolete.balance);
    $('#obsolete_count_good_qty').text(markedObsolete.balance);


    $('#modalObsoleteProductCount').modal('show');


    $('#obsolete_count_damaged_qty').unbind('keyup');

    $('#obsolete_count_damaged_qty').keyup(function () {
        if(parseInt($(this).val()) >= 0)
        {
            let badQty =parseInt($(this).val());
            $('#obsolete_count_good_qty').text(markedObsolete.balance - badQty);

        }
        else{
            $(this).val(0);
            $('#obsolete_count_good_qty').text(markedObsolete.balance);

            alert('Negative values are not valid here.');
        }

        if(parseInt($(this).val()) >0 ){
            $('#add_garage_sale_button').css('display' , 'block');
            $('#add_garage_sale_button').unbind('click');
            $('#add_garage_sale_button').on('click' , addToGarageButtonClicked );
        }
        else
        {
            $('#add_garage_sale_button').css('display' , 'none');

        }

    });


}
function productCountDone() {


    let goodQty = parseInt($('#obsolete_count_good_qty').text());

    console.log(goodQty);

    $('#modalObsoleteProductCount').modal('hide');
    $('#button_remind_later').hide();
    $('#button_mark_obsolete').hide();

    $('#button_obsolete_report_return_supplier').show();
    $('#button_obsolete_report_create_promotion').show();
    $('#obsolete_report_quantity').html('<b>'+markedObsolete.balance+'</b>');
    plotProductTransactionHistoryChart(markedObsolete.id);





    $('#modalObsoleteReport').modal('show');


}



function addToGarageButtonClicked(){
    $('#add_garage_sale_button').css('display' , 'none');
    $('#damage_garage_sale').html('<div class="bg-success"><span class="glyphicon glyphicon-ok"> ' +$('#obsolete_count_damaged_qty').val()+' damaged inventory has been added to garagesale</div>');

    let damagedQty = parseInt($('#obsolete_count_damaged_qty').val());

    if(damagedQty > 0 ) {
        let gId = alasql('SELECT max(id) AS max_id from garagesale')[0]['max_id'];
        gId = gId === undefined ? 1 : gId;

        alasql('INSERT INTO garagesale VALUES(?,?,?,?,?);',[ gId , markedObsolete.id , damagedQty , today , 0 ]);
        let transId = alasql('SELECT max(id) AS max_id from trans')[0]['max_id'];
        alasql("INSERT INTO trans VALUES(?,?,?,?,?,?);",[ transId , markedObsolete.id , today , damagedQty , markedObsolete.balance - damagedQty , 'Added to garage sale'  ]);

        alasql('UPDATE stock SET balance=? where id=?',[markedObsolete.balance - damagedQty , markedObsolete.id]);

        markedObsolete.balance = markedObsolete.balance - damagedQty;



    }


}

function onClickRemindLater(){
    $('#modalObsoleteReport').modal('hide');

    $('#modalRemindLater').modal('show');





}
function onClickRemindLaterDone() {
    let totalDays = parseInt($('#laterRemindDays').val());
    let d = Math.round(( getMSFromDate(today) - getMSFromDate(markedObsolete['last_sale_date']) ) / (24*3600*1000)) +totalDays ;


    console.log(d);
    alasql('UPDATE stock SET obsoleteperiod = ? where id=?',[ d , markedObsolete.id]);
    alasql('UPDATE stock SET isobsolete=0 WHERE id=?', [ markedObsolete.id ]);
    console.log(markedObsolete);

    $('#modalRemindLater').modal('hide');

    window.location.reload(true);






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


function loadCreatePromotion() {
    $('#modalObsoleteReport').modal('hide');

    window.location.replace('new-promotion.html?id='+markedObsolete.id);


}

function onClickReturnToSupplier() {

    window.location.replace('product-return-form.html?q1=obsolete&q2='+markedObsolete.id);

}
