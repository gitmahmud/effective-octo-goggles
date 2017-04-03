/**
 * Created by rahman_ma-pc on 3/15/2017.
 */
// var reorderParam = $.url().param('q');


var statusOption = ['ORDER PLACED', 'SUPPLIER CONFIRMED', 'ORDER RECEIVED', 'PRODUCT SCRUTINIZED'];

var newReorders = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, item.pclass \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.reorderstatus = 1');

var existingReorders = alasql('SELECT reorderproduct.id , item.code , item.detail , reorderproduct.orderquantity, ' +
    'supplier.name AS supplier , reorderproduct.orderplaceddate , reorderproduct.expectedreceivedate ,reorderproduct.stockid, ' +
    'reorderproduct.status, reorderproduct.supplierid  ' +
    'from reorderproduct join supplier ON supplier.id = reorderproduct.supplierid ' +
    'join stock ON stock.id = reorderproduct.stockid join item ON stock.item = item.id where reorderproduct.status <> ? ',
    [statusOption[3]]);


// var statusChangeReorderId = 100;
var statusChangeProductInfo;

var currentStatusChangedDetails ;


displayNewReorders();
displayExistingReorders();

////show total number of products in each status

$("#id_new_reorder_list_stock_quantity_desc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = -a.balance + b.balance
        return cmp === 0 ? a.pclass.localeCompare(b.pclass) : cmp;
    });

    displayNewReorders();

});

$("#id_new_reorder_list_stock_quantity_asc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = a.balance - b.balance
        return cmp === 0 ? a.pclass.localeCompare(b.pclass) : cmp;
    });

    displayNewReorders();

});

$("#id_new_reorder_list_pclass_desc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = a.pclass.localeCompare(b.pclass);
        return cmp === 0 ? -a.balance + b.balance : cmp;
    });

    displayNewReorders();

});

$("#id_new_reorder_list_pclass_asc").on('click', function () {

    newReorders.sort(function (a, b) {
        let cmp = b.pclass.localeCompare(a.pclass);
        return cmp === 0 ? -a.balance + b.balance : cmp;
    });

    displayNewReorders();

});
$("#id_existing_reorder_list_quantity_desc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = -a.orderquantity + b.orderquantity;
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();

});
$("#id_existing_reorder_list_quantity_asc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = a.orderquantity - b.orderquantity;
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});

$("#id_existing_reorder_list_supplier_desc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = b.supplier.localeCompare(a.supplier);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});
$("#id_existing_reorder_list_supplier_asc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = a.supplier.localeCompare(b.supplier);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});

$("#id_existing_reorder_list_order_place_desc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = b.orderplaceddate.localeCompare(a.orderplaceddate);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});
$("#id_existing_reorder_list_order_place_asc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = a.orderplaceddate.localeCompare(b.orderplaceddate);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});

$("#id_existing_reorder_list_order_receive_desc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = b.expectedreceivedate.localeCompare(a.expectedreceivedate);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});
$("#id_existing_reorder_list_order_receive_asc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = a.expectedreceivedate.localeCompare(b.expectedreceivedate);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});

$("#id_existing_reorder_list_order_status_desc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = statusOption.indexOf(b.status) - statusOption.indexOf(a.status);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});
$("#id_existing_reorder_list_order_status_asc").on('click', function () {
    existingReorders.sort(function (a, b) {
        let cmp = statusOption.indexOf(a.status) - statusOption.indexOf(b.status);
        return cmp === 0 ? a.id - b.id : cmp ;
    });
    displayExistingReorders();
});







// $("select[id^='select_reorder_id_']").change(productStatusChange);



$('input[name="input_return_type_radio"] ').change(function () {
    if ($(this).val() === 'damage_return') {
        $('#product_return_returning_quantity').text(statusChangeProductInfo.receivequantitydamaged);
    }
    else {
        $('#product_return_returning_quantity').text(statusChangeProductInfo.orderreceivequantity);
    }

});


function displayNewReorders() {

    let str = '';

    for (let i = 0; i < newReorders.length; i++) {

        let currentProduct = newReorders[i];

        str += '<tr>';
        str += '<td>' + currentProduct.code + '</td>';
        str += '<td>' + currentProduct.maker + '</td>';
        str += '<td>' + currentProduct.detail + '</td>';
        str += '<td>' + currentProduct.balance + '</td>';
        str += '<td>' + currentProduct.pclass + '</td>';
        str += '<td><a href="reorder-form.html?id=' + currentProduct.id + '"><button class="btn btn-primary">Reorder</button></a></td></tr>'

    }

    $('#tbody_new_reorder').html(str);


}

function displayExistingReorders() {
    let str = '';

    let waitingSupplierConf = 0;
    let waitingProductReceive = 0;
    let waitingProductScruniti = 0;

    for (let i = 0; i < existingReorders.length; i++) {

        let currentProduct = existingReorders[i];
        let statusIndex = statusOption.indexOf(currentProduct.status) ;


        str += '<tr>' +
            '<td>' + currentProduct.id + '</td>' +
            '<td><a href="stock.html?id='+ currentProduct['stockid'] +'">' + currentProduct.code + '</a></td>' +
            '<td>' + currentProduct.detail + '</td>' +
            '<td>' + currentProduct.orderquantity + '</td>' +
            '<td><button class="btn" onclick="onClickSupplierDetails('+currentProduct['supplierid']+')"><span class="glyphicon glyphicon-info-sign"></span>' + currentProduct.supplier + '</button></td>' +
            '<td>' + currentProduct.orderplaceddate + '</td>' +
            '<td>' + currentProduct.expectedreceivedate + '</td>' +
            '<td><select class="form-control" id="select_reorder_id_' + currentProduct.id + '"> ';


        for (let j = statusIndex; j < statusOption.length; j++) {

            str += '<option value="' + statusOption[j] + '"'+ (j > statusIndex+1 ? ' disabled ':'') +'>' + statusOption[j] + '</option>';

        }
        str += '</select></td></tr>';

        if(currentProduct.status === statusOption[0])
        {
            waitingSupplierConf++;
        }
        if(currentProduct.status === statusOption[1])
        {
            waitingProductReceive++;
        }
        if(currentProduct.status === statusOption[2])
        {
            waitingProductScruniti++;
        }

        $('#wating_supplier_confirmation').text(waitingSupplierConf);
        $('#waiting_product_receive').text(waitingProductReceive);
        $('#waiting_product_scruniti').text(waitingProductScruniti);



    }

    $('#tbody_existing_reorder').html(str);
    $("select[id^='select_reorder_id_']").change(productStatusChange);


}

function productStatusChange() {
    let arr = $(this).attr('id').split('_');
    let reorderId = parseInt(arr[arr.length - 1]);
    let changedStatus = $(this).val();
    statusChangeProductInfo = alasql('SELECT reorderproduct.id , item.code , item.detail , reorderproduct.orderquantity, ' +
        'supplier.name AS supplier , reorderproduct.orderplaceddate , reorderproduct.expectedreceivedate , ' +
        'reorderproduct.status, reorderproduct.orderreceiveddate  ,' +
        'reorderproduct.orderreceivequantity , reorderproduct.receivequantitygood ,  reorderproduct.receivequantitydamaged, ' +
        'reorderproduct.stockid , stock.balance , reorderproduct.supplierid ' +
        'from reorderproduct join supplier ON supplier.id = reorderproduct.supplierid ' +
        'join stock ON stock.id = reorderproduct.stockid join item ON stock.item = item.id where reorderproduct.id = ?', [reorderId])[0];

    if (statusOption.indexOf(changedStatus) === 1) {
        alasql('UPDATE reorderproduct SET status = ? where id= ? ', [statusOption[1], reorderId]);
        window.location.reload(true);

    }
    else if (statusOption.indexOf(changedStatus) === 2) {

        let str = '<label class="label label-default" for="#id_product_arrival_date" style="font-size: larger">Select product arrival date </label>';
        str += '<input type="date" id="id_product_arrival_date"  class="form-control input-lg">';
        str += '<span style="display: none" id="modal_product_reorder_id">' + reorderId + '</span>'

        $('#datepicker_modal').html(str);

        $('#id_product_arrival_date').val(statusChangeProductInfo.expectedreceivedate);



        $('#modalSelectDate').modal('show');


    }
    else if (statusOption.indexOf(changedStatus) === 3) {
        let productName = $(this).parent().parent().children().eq(1).text();
        let str = '<tr>';
        str += '<th> Order ID : </th>' +
            '<td>' + reorderId + '</td></tr>' +
            '<tr><th> Product name </th>' +
            '<td>' + productName + '</td></tr>' +
            '<tr><th>Order quantity </th><td >'+statusChangeProductInfo['orderquantity']+'</td></tr>'+
            '<tr><th>Receive Quantity (Good ) : </th>' +
            '<td><input type="number" class="form-control" value="0" id="receiveQuantityGood"></td></tr>' +
            '<tr><th>Receive Quantity (Damaged ) : </th>' +
            '<td><input type="number" class="form-control" value="0" id="receiveQuantityBad"></td></tr>';


        $('#tbody_product_scruniti').html(str);

        $('#receiveQuantityGood').val(statusChangeProductInfo.orderquantity);

        $('#receiveQuantityBad').unbind('keyup');
        $('#receiveQuantityBad').on('keyup',function () {

            let badQty = parseInt($('#receiveQuantityBad').val());
            $('#receiveQuantityGood').val(statusChangeProductInfo.orderquantity - badQty);

        });

        $('#receiveQuantityGood').unbind('keyup');
        $('#receiveQuantityGood').on('keyup',function () {

            let goodQty = parseInt($('#receiveQuantityGood').val());
            $('#receiveQuantityBad').val(statusChangeProductInfo.orderquantity - goodQty);
        });




        $('#modalProductScrutinize').modal('show');


    }
    else {
        console.log('');
    }



}

function productArrived() {
    let arrivalDate = $('#id_product_arrival_date').val();

    alasql('UPDATE reorderproduct SET orderreceiveddate = ? , status =? where id = ?', [arrivalDate, statusOption[2], statusChangeProductInfo.id]);

    $('#modalSelectDate').modal('hide');

    window.location.reload(true);

}
function checkReceiveProduct() {
    $('#modalProductScrutinize').modal('hide');

    let goodQuantity = parseInt($('#receiveQuantityGood').val());
    let badQuantity = parseInt($('#receiveQuantityBad').val());
    let reportInfo = statusChangeProductInfo;

    console.log('report info ', reportInfo);

    $('#report_order_id').text(reportInfo.id);
    $('#report_product_name').text(reportInfo.code);
    $('#report_order_date').text(reportInfo.orderplaceddate);
    $('#report_expected_arrival').text(reportInfo.expectedreceivedate);

    $('#report_arrival_date').text(reportInfo.orderreceiveddate);
    let arrivalStatus = reportInfo.expectedreceivedate.localeCompare(reportInfo.orderreceiveddate);
    arrivalStatus = arrivalStatus === 0 ? '<label class="label-primary">On time</label>' : (arrivalStatus > 0 ? '<label class="label-success">Early Arrival</label>' : '<label class="label-danger">Delay Arrival</label>' );
    $('#report_arrival_status').html(arrivalStatus);
    $('#report_order_quantity').text(reportInfo.orderquantity);
    let totalReceiveQuantity = goodQuantity + badQuantity;
    let totalReceiveQuantityStatus = totalReceiveQuantity < reportInfo.orderquantity ? '<label class="label-danger">' + totalReceiveQuantity + '</label>' : '<label class="label-success">' + totalReceiveQuantity + '</label>';
    $('#report_total_receive_quantity').html(totalReceiveQuantityStatus);

    $('#report_good_quantity').text(goodQuantity);
    $('#report_damaged_quantity').text(badQuantity);
    $('#report_percent_good').text((goodQuantity * 100 / totalReceiveQuantity).toFixed(2));
    $('#report_percent_damaged').text((badQuantity * 100 / totalReceiveQuantity).toFixed(2));
    $('#report_supplier').text(reportInfo.supplier);
    plotPieChart('orderReportPieGraph' , goodQuantity , badQuantity);



    alasql('UPDATE reorderproduct SET orderreceivequantity = ? , receivequantitygood =? , receivequantitydamaged =? , status = ?' +
        ' where id = ?', [totalReceiveQuantity, goodQuantity, badQuantity,  statusOption[3], reportInfo.id  ]);




    $('#modalOrderReport').modal('show');

    console.log(goodQuantity, badQuantity);


}






function addToInvenory() {

    if($('input[name="supplier_rate"]:checked').val() === undefined)
    {
        alert('Please provide rating for supplier.');
        return ;
    }



    statusChangeProductInfo = alasql('SELECT reorderproduct.id , item.code , item.detail , reorderproduct.orderquantity, ' +
        'supplier.name AS supplier , reorderproduct.orderplaceddate , reorderproduct.expectedreceivedate , ' +
        'reorderproduct.status, reorderproduct.orderreceiveddate  ,' +
        'reorderproduct.orderreceivequantity , reorderproduct.receivequantitygood ,  reorderproduct.receivequantitydamaged, ' +
        'reorderproduct.stockid , stock.balance , reorderproduct.supplierid ' +
        'from reorderproduct join supplier ON supplier.id = reorderproduct.supplierid ' +
        'join stock ON stock.id = reorderproduct.stockid join item ON stock.item = item.id where reorderproduct.id = ?', [statusChangeProductInfo.id])[0];

    alasql("UPDATE stock SET balance=? where id=?",
    [ statusChangeProductInfo.balance + statusChangeProductInfo.receivequantitygood , statusChangeProductInfo.stockid ]);



    let transId = alasql('SELECT max(id)+1 AS max_id from trans')[0]['max_id'];
    alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
        [ transId , statusChangeProductInfo.stockid ,
            statusChangeProductInfo.orderreceiveddate ,
            statusChangeProductInfo.receivequantitygood,
            statusChangeProductInfo.balance + statusChangeProductInfo.receivequantitygood,
            'Purchased'
        ]);

    alasql('UPDATE stock SET reorderstatus = 0 where id = ?', [statusChangeProductInfo.stockid]);


    let rateId = alasql('SELECT max(id)+1 AS max_id from supplierrating')[0]['max_id'];

    let rating = parseInt($('input[name="supplier_rate"]:checked').val());

    alasql('INSERT INTO supplierrating VALUES(?,?,?)',
        [rateId , statusChangeProductInfo.supplierid , rating ]);

    let currentTotalDelivered = alasql('SELECT totaldelivered from supplier where id=?',[ statusChangeProductInfo.supplierid ])[0]['totaldelivered'];
    alasql('UPDATE supplier SET totaldelivered= ? where id=?',[ currentTotalDelivered+1 , statusChangeProductInfo.supplierid]);


    $('#modalOrderReport').modal('hide');

    if(statusChangeProductInfo.receivequantitydamaged >0)
    {
        let flag = confirm("This order contains damaged goods . Do you want to return damaged goods to the supplier ? ");

        if(flag)
        {
            window.location.replace('product-return-form.html?q1=damage&q2='+statusChangeProductInfo.id);
        }
        else
        {
            window.location.reload(true);

        }

    }
    else{

        let flag = confirm("Do you want see current inventory level for this product ?");

        if(flag){
            window.open('stock.html?id='+statusChangeProductInfo.stockid);
        }
        window.location.reload(true);


    }


}
function plotPieChart(divId ,goodQty,badQty) {

    Highcharts.chart(divId, {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: ''
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',

                }
            }
        },
        series: [{
            name: 'Brands',
            colorByPoint: true,
            data: [{
                name: 'Intact',
                y: goodQty,
                color : '#008000'
            }, {
                name: 'Damaged',
                y: badQty,
                color : '#ff0000'

            }]
        }]
    });

}

function onClickSupplierDetails(supplierid) {

    let supplierInfo = alasql('SELECT * from supplier where id=?',[supplierid])[0];
    let str = '';

    str+= '<tr><th>Supplier name :</th><td>'+ supplierInfo['name']+'</td></tr>';
    str+= '<tr><th>Address :</th><td>'+ supplierInfo['address']+'</td></tr>';
    str+= '<tr><th>Email</th><td><span  style="font-weight: bold;font-size: large"> '+ supplierInfo['email']+'</span></td></tr>';
    str+= '<tr><th>Telephone:</th><td><span  style="font-weight: bold;font-size: large"> '+ supplierInfo['tel']+'</span></td></tr>';

    let rating = alasql('SELECT AVG(rating) AS avg_rating,last(rating) AS last_rating  from supplierrating where supplierid=? group by supplierid;', [ supplierid ])[0];
    str+= '<tr><th>Average rating :</th><td><span  style="font-weight: bold;font-size: large"> '+ rating['avg_rating'].toFixed(2)+'</span></td></tr>';

    $('#supplier_info').html(str);
    $('#modalShowSupplierInfo').modal('show');



}