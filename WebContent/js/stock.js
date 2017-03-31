// get id
var id = parseInt($.url().param('id'));
$("input[name=id]").val(id);

var today = localStorage.getItem('today');

var statusOption = ['ORDER PLACED', 'SUPPLIER CONFIRMED', 'ORDER RECEIVED', 'PRODUCT SCRUTINIZED'];

// read item data
var sql = 'SELECT item.id, whouse.name, item.code, item.maker, item.detail, item.price, stock.balance, stock.reorderstatus \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE stock.id = ?';
var row = alasql(sql, [ id ])[0];
$('#image').attr('src', 'img/' + row.id + '.jpg');
$('#whouse').text(row.name);
$('#code').text(row.code);
$('#maker').text(row.maker);
$('#detail').text(row.detail);
$('#price').text(numberWithCommas(row.price));
var balance = row.balance; // will be used later
$('#balance').text(balance);


var reorderInfo;
if(row['reorderstatus'] === 0  || row['reorderstatus'] === 1)
{
	$('#notReorderedDiv').css('display','block');
	$('#alreadyReorderedDiv').css('display' , 'none');

}
else
{
    $('#notReorderedDiv').css('display','none');
    $('#alreadyReorderedDiv').css('display' , 'block');

    reorderInfo =  alasql('SELECT * from reorderproduct where stockid=? and status != "PRODUCT SCRUTINIZED"',[id])[0];

    let str = '';

    str+= '<tr><th>Order ID : </th><td>'+ reorderInfo.id;
    let cancelButton = '<button class="btn btn-danger" style="margin-left: 20%" id="id_change_receive_date" onclick="onClickCancelReorder()"><span class="glyphicon glyphicon-remove"></span>Cancel order</button>';

    if(reorderInfo.status !== statusOption[2])
	{
		str+= cancelButton+'</td></tr>';

	}
	else
	{
		str+= '</td></tr>'
	}



    if(reorderInfo['orderplaceddate'] !== '')
	{
		str+= '<tr><th>Order placed : </th><td>'+ reorderInfo['orderplaceddate'] +'</td></tr>' ;

	}

    str+= '<tr><th>Current status : </th><td style="font-size: large;font-weight: bold">'+ reorderInfo['status'] +'</td></tr>' ;

    str+= '<tr><th>Next status : </th><td style="font-size: large;font-weight: bold">'+ statusOption[(statusOption.indexOf(reorderInfo['status'])+1)] +'</td></tr>' ;





    if(reorderInfo['orderquantity'] !== 0 )
    {
        str+= '<tr><th>Order quantity : </th><td>'+ reorderInfo['orderquantity'] +'</td></tr>' ;

    }

    if(reorderInfo['expectedreceivedate'] !== '' )
    {
        str+= '<tr><th>Expected receive date : </th><td>'+ reorderInfo['expectedreceivedate']  ;

    }

    let changeButton = '<button class="btn btn-info" style="margin-left: 20%" onclick="onClickChangeReceiveDate()"><span class="glyphicon glyphicon-pencil"></span>Change Expected receive date</button>';


    if(reorderInfo.status !== statusOption[2])
    {
        str+= changeButton+'</td></tr>';

    }
    else
    {
        str+= '</td></tr>'
    }




    if(reorderInfo['orderreceiveddate'] !== '' )
    {
        str+= '<tr><th>Actual receive date : </th><td>'+ reorderInfo['orderreceiveddate'] +'</td></tr>' ;

    }

    let supplierInfo = alasql('SELECT * from supplier where id=?',[reorderInfo.supplierid])[0];

    str+= '<tr><th>Supplier name :</th><td>'+ supplierInfo['name']+'</td></tr>';
    str+= '<tr><th>Address :</th><td>'+ supplierInfo['address']+'</td></tr>';
    str+= '<tr><th>Email</th><td><span class="label-info" style="font-weight: bold;font-size: large"> '+ supplierInfo['email']+'</span></td></tr>';
    str+= '<tr><th>Telephone:</th><td><span class="label-info" style="font-weight: bold;font-size: large"> '+ supplierInfo['tel']+'</span></td></tr>';


    $('#currentReorderTable').html(str);



}








// read transaction
var rows = alasql('SELECT * FROM trans WHERE stock = ?', [ id ]);
var tbody = $('#tbody-transs');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var tr = $('<tr>').appendTo(tbody);
	tr.append('<td>' + row.date + '</td>');
	tr.append('<td>' + row.qty + '</td>');
	tr.append('<td>' + row.balance + '</td>');
	tr.append('<td>' + row.memo + '</td>');
}

// storage/retrieval
$('#update').on('click', function() {
	var date = $('input[name="date"]').val();
	var qty = parseInt($('input[name="qty"]').val());
	var memo = $('textarea[name="memo"]').val();
	alasql('UPDATE stock SET balance = ? WHERE id = ?', [ balance + qty, id ]);
	var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
	alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)', [ trans_id, id, date, qty, balance + qty, memo ]);
	window.location.assign('stock.html?id=' + id);
});


function onClickReorderNow()
{
	window.location.replace('reorder-form.html?id='+id);

}

function onClickCancelReorder() {

	alasql('UPDATE stock SET reorderstatus=0 where id=?',[ id]);
	alasql('UPDATE reorderproduct SET status=? where id=?',[ statusOption[3] , reorderInfo.id ]);

	window.location.reload(true);

}

function onClickChangeReceiveDate() {
	$('#modalChangeDateReorder').modal('show');


}

function onChangedExpectedArrivalDate() {

	let newExpectedDate = $('#id_product_expected_arrival_date').val();

	if(newExpectedDate === '' || newExpectedDate < today)
	{
		alert('Select a  valid date first.');
		return;
	}

    alasql('UPDATE reorderproduct SET expectedreceivedate=? where id=?',[ newExpectedDate , reorderInfo.id ]);

    window.location.reload(true);



}