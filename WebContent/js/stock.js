// get id
var id = parseInt($.url().param('id'));
$("input[name=id]").val(id);

var today = localStorage.getItem('today');

var statusOption = ['ORDER PLACED', 'SUPPLIER CONFIRMED', 'ORDER RECEIVED', 'PRODUCT SCRUTINIZED'];

// read item data
var sql = 'SELECT item.id, whouse.name, item.code, item.maker, item.detail, item.price, stock.balance, stock.reorderstatus, \
    stock.obsoleteperiod , stock.maxusage , stock.leadtime , stock.avgdailyusage , stock.maxleadtime , stock.isobsolete\
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
$('#obsolete_period').text(row.obsoleteperiod);
$('#max_usage_daily').text(row.maxusage);
$('#lead_time').text(row.leadtime);
$('#avg_daily_usage').text(row.avgdailyusage);
$('#max_lead_time').text(row.maxleadtime);
if(row.isobsolete >=2 )
{
    $('#product_obsolete').show();
}



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


if(row['isobsolete'] >=2)
{
    $('#notReorderedDiv').css('display','none');

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



    let currentBackorders = getBackorder().backorderDetails;

    for(let i = 0 ; i<currentBackorders.length ; i++)
    {
        let currentBackorder = currentBackorders[i];

        if(currentBackorder['type'] === 'stock')
        {

            let notifyId = alasql('SELECT max(id)+1 AS max_id from customernotify ');
            notifyId = notifyId.length === 0 ?1:notifyId[0]['max_id'];

            let notifyText = 'Delivery date for your backorder ID #'+currentBackorder['id']+' has been cancelled temporarily. You will be notified about new product arrival date . Sorry for the inconvenience.';
            alasql('INSERT INTO customernotify VALUES(?,?,?)',[notifyId , notifyText , 0]);

        }




    }







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
	notifyCustomerAboutChange(reorderInfo.id);



    window.location.reload(true);



}

function notifyCustomerAboutChange(rpid) {


    let reorderProductDetails =  alasql('SELECT * from reorderproduct where id=?',[rpid])[0];

    let currentBackorders = getBackorder().backorderDetails;

    for(let i = 0 ; i<currentBackorders.length ; i++)
    {
        let currentBackorder = currentBackorders[i];

        if(currentBackorder['type'] === 'stock')
        {
            let notifyId = alasql('SELECT max(id)+1 AS max_id from customernotify ');
            notifyId = notifyId.length === 0 ?1:notifyId[0]['max_id'];

            let notifyText = 'Expected delivery date for your backorder ID#'+ currentBackorder['id'] +' has been changed . New expected date of delivery is   : '+reorderProductDetails['expectedreceivedate'];
            alasql('INSERT INTO customernotify VALUES(?,?,?)',[notifyId , notifyText , 0]);

        }

        //
        // if(currentBackorder['type'] === 'bundle')
        // {
        //     let allBundleItems = alasql("SELECT * from bundleitems where pbid = ? ", [currentBackorder['tid']]);
        //     let flag = true;
        //     let finalExpectedDate = reorderProductDetails['expectedreceivedate'];
        //
        //     for(let j = 0 ; j< allBundleItems.length ; j++){
        //
        //         let currentReorderStatus = alasql('SELECT reorderstatus from stock where id=?', allBundleItems[i]['stockid'])['reorderstatus'];
        //         if(currentReorderStatus === 1 )
        //         {
        //
        //             flag = false;
        //             break;
        //
        //         }
        //         else
        //         {
        //          let currentExpectedDate =
        //              alasql('SELECT * from reorderproduct JOIN stock ON reorderproduct.stockid = stock.id where stock.reorderstatus=2 and stock.id=? and reorderproduct.status!="PRODUCT SCRUTINIZED"',[ allBundleItems[i]['stockid'] ])[0]['expectedreceivedate'];
        //             finalExpectedDate = finalExpectedDate > currentExpectedDate ? finalExpectedDate : currentExpectedDate;
        //         }
        //
        //     }
        //
        //     if(flag)
        //     {
        //         let notifyId = alasql('SELECT max(id)+1 AS max_id from customernotify ');
        //         notifyId = notifyId.length === 0 ?1:notifyId[0]['max_id'];
        //
        //         let notifyText = 'Expected delivery date for your backorder ID#'+ currentBackorder['id'] +' is : '+finalExpectedDate;
        //         alasql('INSERT INTO customernotify VALUES(?,?,?)',[notifyId , notifyText , 0]);
        //
        //     }
        //
        // }
        //
        // if(currentBackorder['type'] === 'free')
        // {
        //     let freeProduct = alasql('SELECT * from promotionfree where id= ?',
        //         [currentBackorder['tid']])[0];
        //
        //     let promotionMasterDetails = alasql('SELECT * from promotionmaster where id= ?',
        //         [freeProduct['pmid']])[0];
        //
        //     let freeReorderStatus = alasql('SELECT reorderstatus from stock where id=?',[freeProduct.originalstockid] )['reorderstatus'];
        //
        //     let promotionReorderStatus = alasql('SELECT reorderstatus from stock where id=?',[promotionMasterDetails.obsoletestockid] )['reorderstatus'];
        //
        //     if(freeReorderStatus !== 1 && promotionReorderStatus !== 1)
        //     {
        //         let currentExpectedDate =
        //             alasql('SELECT * from reorderproduct JOIN stock ON reorderproduct.stockid = stock.id where stock.reorderstatus=2 and stock.id=? and reorderproduct.status!="PRODUCT SCRUTINIZED"',[ freeProduct.originalstockid ])[0]['expectedreceivedate'];
        //
        //         let currentExpectedDate2 =
        //             alasql('SELECT * from reorderproduct JOIN stock ON reorderproduct.stockid = stock.id where stock.reorderstatus=2 and stock.id=? and reorderproduct.status!="PRODUCT SCRUTINIZED"',[ promotionMasterDetails.obsoletestockid ])[0]['expectedreceivedate'];
        //
        //         currentExpectedDate = currentExpectedDate > currentExpectedDate2 ? currentExpectedDate : currentExpectedDate2;
        //
        //         let notifyId = alasql('SELECT max(id)+1 AS max_id from customernotify ');
        //         notifyId = notifyId.length === 0 ?1:notifyId[0]['max_id'];
        //
        //         let notifyText = 'Expected delivery date for your backorder ID#'+ currentBackorder['id'] +' is : '+currentExpectedDate;
        //         alasql('INSERT INTO customernotify VALUES(?,?,?)',[notifyId , notifyText , 0]);
        //
        //
        //
        //     }
        //
        //
        //
        //
        //
        //
        // }
        //



    }










}

function getBackorder() {
    let backorderQuantity = 0;
    let backorders = 0;
    let backorderProducts = [];

    let allBackorders = alasql('SELECT * from customerorder where isbackorder = 2');

    for (let i = 0; i < allBackorders.length; i++) {
        if (allBackorders[i]['type'] === 'stock' && allBackorders[i]['tid'] === id) {
            backorders += 1;
            backorderQuantity += allBackorders[i]['quantity'];
            backorderProducts.push(allBackorders[i]);

        }

        if (allBackorders[i]['type'] === 'bundle') {
            let allBundleItems = alasql("SELECT * from bundleitems where pbid = ? ", [allBackorders[i]['tid']]);

            allBundleItems.forEach(function (it, index) {
                if (it['stockid'] === id) {
                    backorders += 1;
                    backorderQuantity += allBackorders[i]['quantity'] * it['quantity'];
                    backorderProducts.push(allBackorders[i]);
                }
            });
        }
        if (allBackorders[i]['type'] === 'free') {
            let freeProduct = alasql('SELECT * from promotionfree where id= ?',
                [allBackorders[i]['tid']])[0];

            let promotionMasterDetails = alasql('SELECT * from promotionmaster where id= ?',
                [freeProduct['pmid']])[0];


            if (freeProduct['originalstockid'] === id) {
                backorders += 1;
                backorderQuantity += allBackorders[i]['quantity'] * freeProduct['quantity'];
                backorderProducts.push(allBackorders[i]);

            }

            if (promotionMasterDetails['obsoletestockid'] === id) {
                backorders += 1;
                backorderQuantity += allBackorders[i]['quantity'];
                backorderProducts.push(allBackorders[i]);

            }


        }


    }

    return {
        'total': backorders,
        'qty': backorderQuantity,
        'backorderDetails' :backorderProducts
    };


}
