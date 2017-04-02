/**
 * Created by rahman_ma-pc on 3/28/2017.
 */

var q1 = $.url().param('q1');

let statusChangeProductInfo;
let totalSuppliers;
let allSuplliers = alasql('SELECT * from supplier');
let details;

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
        'join stock ON stock.id = reorderproduct.stockid join item ON stock.item = item.id where reorderproduct.id = ?', [reorderId])[0];

    $('#product_return_order_id').text(reorderId);
    $('#product_return_product_name').text(statusChangeProductInfo.code);
    $('#product_return_expected_arrival').text(statusChangeProductInfo.expectedreceivedate);
    $('#product_return_arrival_date').text(statusChangeProductInfo.orderreceiveddate);
    $('#product_return_order_quantity').text(statusChangeProductInfo.orderquantity);
    $('#product_return_received_quantity').text(statusChangeProductInfo.orderreceivequantity);
    $('#product_return_damaged_quantity').text(statusChangeProductInfo.receivequantitydamaged);
    $('#product_return_reason').text(statusChangeProductInfo.receivequantitydamaged + ' products are found damaged in this order and hereby returned.');


}


if (q1 === 'obsolete') {
    totalSuppliers = 1;


    let supplierSelect = '<select class="form-control" style="width: 250px;" id="select_supplier_id_' + totalSuppliers + '">';

    allSuplliers.forEach(function (it, index) {
        supplierSelect += '<option value="' + it.name + '">' + it.name + '</option>';
    });
    supplierSelect += '</select>';


    let str =
            '<tr>' +
            '<th class="col-sm-3">Product Name :</th>' +
            '<td id="product_return_product_name"></td>' +
            '</tr>' +
            '<tr>' +
            '<th>Total quantity :</th>' +
            '<td id="product_return_quantity"></td>' +
            '<tr>' +
            '<th>Reason for return</th>' +
            '<td style="font-size: large;font-weight: bold"><span class="bg-danger">Obsolete</span></td>' +
            '</tr>' +
            '<tr>' +
            '<th>Additional reason :</th>' +
            '<td><textarea class="form-control" rows="6" id="product_return_reason"></textarea></td>' +
            '</tr>' +
            '<tr>' +
            '<td colspan="2" class="bg-info">Select supplier and input damaged quantity count for each supplier.</td>' +
            '</tr>' +
            '<tr>' +
            '<td class="text-center" >' + supplierSelect + '</td>' +
            '<td><input class="form-control" type="number" style="width: 70px;" value="0" id="select_supplier_quantity_' + totalSuppliers + '"></td>' +
            '</tr>' +
            '<tr id="add_another_supplier"><td colspan="2" > <button class="btn btn-link" onclick="onClickAddAnotherSupplier()">Add antoher supplier</button></td></tr>'

        ;


    $('#tbody_prf').html(str);


    let q2 = parseInt($.url().param('q2'));
    details = alasql('SELECT stock.balance , item.code from stock JOIN item ON stock.item = item.id where stock.id=?', [q2])[0];
    console.log(details);
    $('#product_return_product_name').text(details.code);
    $('#product_return_quantity').text(details.balance);

    $('#product_return_reason').text('Products not sold for long period and hereby got obsolete.')
    $("input[id^='select_supplier_quantity_']").unbind('keyup');
    $("input[id^='select_supplier_quantity_']").on('keyup', onKeyUpQuantityInput);


}

function onClickAddAnotherSupplier() {
    totalSuppliers++;


    let supplierSelect = '<select class="form-control" style="width: 250px;" id="select_supplier_id_' + totalSuppliers + '">';

    allSuplliers.forEach(function (it, index) {
        supplierSelect += '<option value="' + it.name + '">' + it.name + '</option>';
    });
    supplierSelect += '</select>';
    let str = '<tr>' +
        '<td class="text-center" >' + supplierSelect + '</td>' +
        '<td><input class="form-control" type="number" style="width: 70px;" value="0" id="select_supplier_quantity_' + totalSuppliers + '"></td>' +
        '</tr>';

    $(str).insertBefore('#add_another_supplier');

    $("input[id^='select_supplier_quantity_']").unbind('keyup');
    $("input[id^='select_supplier_quantity_']").on('keyup', onKeyUpQuantityInput);


}


function onClickReturn() {

    if (q1 === 'damage') {
        alert('Product return form has been sent to supplier mail address : ' + statusChangeProductInfo.smail);
        window.location.replace('index.html?inv=1');
    }
    if (q1 === 'obsolete') {
        let str = 'Product return form has been sent to supplier mail address : ';
        for (let i = 1; i <= totalSuppliers; i++) {
            let name = $('#select_supplier_id_' + i).val();

            let t = allSuplliers.find(function (it, index) {
                return it.name === name;
            });

            str += t.email + ','


        }
        str = str.substr(0, str.length - 1);
        str += '.';

        alert(str);

        let q2 = parseInt($.url().param('q2'));

        alasql('UPDATE stock SET balance = ? where id=?', [0, q2]);

        if (confirm('Do you want to remove this product from system ?')) {
            alasql('DELETE FROM stock WHERE id=?', [q2]);


        }

        window.location.replace('index.html?inv=1');


    }
}

function onKeyUpQuantityInput() {
    let sum = 0;
    for (let i = 1; i <= totalSuppliers; i++) {
        let quant = parseInt($('#select_supplier_quantity_' + i).val());
        sum += quant;
    }

    if (sum !== details.balance) {
        $('#return_product_button').attr('disabled', true);
        $('#return_product_button').attr('data-toggle', 'tooltip');
        $('#return_product_button').attr('data-placement', 'top');
        $('#return_product_button').attr('title', 'Total product quantity does not match with sum of all suppliers returning quantity.');


    }
    else {
        $('#return_product_button').attr('disabled', false);
        $('#return_product_button').removeAttr('data-toggle');
        $('#return_product_button').removeAttr('data-placement');
        $('#return_product_button').removeAttr('title');


    }


}