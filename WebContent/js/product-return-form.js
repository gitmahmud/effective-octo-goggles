/**
 * Created by rahman_ma-pc on 3/28/2017.
 */

var q1 = $.url().param('q1');

let statusChangeProductInfo ;

if (q1 === 'damage') {

    let str = '<tr>' +
        '<th>Order ID :#</th>' +
        '<td id="product_return_order_id"></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Product Name :</th>' +
        '<td id="product_return_product_name"></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Expected arrival date :</th>' +
        '<td id="product_return_expected_arrival"></td>' +
        '</tr>' +

        '<tr>' +
        '<th>Arrival date :</th>' +
        '<td id="product_return_arrival_date"></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Order quantity :</th>' +
        '<td id="product_return_order_quantity"></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Received quantity :</th>' +
        '<td id="product_return_received_quantity" ></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Damaged quantity (if any) :</th>' +
        '<td id="product_return_damaged_quantity" class="bg-danger"></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Reason for return :</th>' +
        '<td><textarea class="form-control" rows="6" id="product_return_reason"></textarea></td>' +
        '</tr>' +
        '<tr>' +
        '<th>Opened Status :</th>' +
        '<td><select class="form-control" style="width: 130px;" id="product_return_open_status">' +
        '<option>Unopened</option>' +
        '<option>Opened</option>' +
        '</select></td>' +
        '</tr>';

    $('#tbody_prf').html(str);

    var reorderId = parseInt($.url().param('q2'));

    statusChangeProductInfo = alasql('SELECT reorderproduct.id , item.code , item.detail , reorderproduct.orderquantity, ' +
        'supplier.name AS supplier , supplier.email AS smail, reorderproduct.orderplaceddate , reorderproduct.expectedreceivedate , ' +
        'reorderproduct.status, reorderproduct.orderreceiveddate  ,' +
        'reorderproduct.orderreceivequantity , reorderproduct.receivequantitygood ,  reorderproduct.receivequantitydamaged, ' +
        'reorderproduct.stockid , stock.balance , reorderproduct.supplierid ' +
        'from reorderproduct join supplier ON supplier.id = reorderproduct.supplierid ' +
        'join stock ON stock.id = reorderproduct.stockid join item ON stock.item = item.id where reorderproduct.id = ?', [ reorderId ])[0];

    $('#product_return_order_id').text(reorderId);
    $('#product_return_product_name').text(statusChangeProductInfo.code);
    $('#product_return_expected_arrival').text(statusChangeProductInfo.expectedreceivedate);
    $('#product_return_arrival_date').text(statusChangeProductInfo.orderreceiveddate);
    $('#product_return_order_quantity').text(statusChangeProductInfo.orderquantity);
    $('#product_return_received_quantity').text(statusChangeProductInfo.orderreceivequantity);
    $('#product_return_damaged_quantity').text(statusChangeProductInfo.receivequantitydamaged);
    $('#product_return_reason').text(statusChangeProductInfo.receivequantitydamaged+' products are found damaged in this order and hereby returned.');




}




function onClickReturn() {

    alert('Product return form has been sent to supplier mail address : '+statusChangeProductInfo.smail);

    window.location.replace('index.html?inv=1');
}