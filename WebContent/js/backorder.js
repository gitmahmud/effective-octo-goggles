/**
 * Created by rahman_ma-pc on 3/30/2017.
 */

var today = localStorage.getItem('today');

var allBackorderArrivals = alasql("SELECT * from customerorder where isbackorder=3");


let str = '';

for(let i = 0 ; i<allBackorderArrivals.length ; i++)
{
    let currentBackorder = allBackorderArrivals[i];
    str+= '<tr>';
    str += '<td>'+currentBackorder['id']+'</td>';

    let name = ''
    if(currentBackorder['type'] === 'stock')
    {
        name = alasql('SELECT item.code from stock JOIN item ON stock.item = item.id where stock.id = ?',[currentBackorder['tid']])[0]['code'];

    }
    if(currentBackorder['type'] === 'bundle')
    {
        name = alasql('SELECT * from promotionbundle where id=?',[ currentBackorder['tid'] ])[0]['name'];

    }
    if(currentBackorder['type'] === 'free')
    {
        let freeDetails = alasql('SELECT * from promotionfree where id=?',[ currentBackorder['tid']])[0];
        let originalname = alasql('SELECT item.code from stock JOIN item ON stock.item = item.id where stock.id = ?',[freeDetails['originalstockid']])[0]['code'];
        let t = alasql('SELECT * from promotionmaster where id=?',[freeDetails.pmid])[0]['obsoletestockid'];

        let freename = alasql('SELECT item.code from stock JOIN item ON stock.item = item.id where stock.id = ?',[t])[0]['code'];

        name = originalname +' + '+freename+'(free)';

    }

    str += '<td>'+name+'</td>';
    str += '<td>'+currentBackorder['type']+'</td>';

    str += '<td>'+currentBackorder['quantity']+'</td>';
    str+= '<td><button class="btn btn-success" id="id_deliver_notify_'+ currentBackorder['id']+'">Deliver & Notify</button></td>';

    str+= '</tr>'


}

console.log(str);

$('#tbody_backroder_arrival').html(str);

$('button[id^="id_deliver_notify_"]').unbind('click');
$('button[id^="id_deliver_notify_"]').on('click',onClickDeliverNotify);



function onClickDeliverNotify() {

    console.log($(this));
    let arr = $(this).attr('id').split('_');
    let backorderId = parseInt(arr[arr.length-1]);

    let backorder = allBackorderArrivals.find(function(it,index){

        return it['id'] === backorderId;
    });

    if(backorder['type'] === 'stock')
    {
        let currentVal = alasql('SELECT balance from stock where id=?',[ backorder['tid'] ])[0]['balance'];
        alasql('UPDATE stock SET balance=? where id=?',[currentVal - backorder['quantity'] , backorder['tid']]);
        let transId = alasql('SELECT max(id)+1 as max_id from trans')[0]['max_id'];
        alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
            [ transId , backorder['tid'] , today , backorder['quantity']*(-1) , currentVal - backorder['quantity'] , 'Sold' ]);
        alasql('UPDATE customerorder SET isbackorder=-1 where id=?',[backorder['id']]);

    }
    if(backorder['type'] === 'bundle')
    {

        let allBundleItems = alasql('SELECT * from bundleitems where id=?',[ backorder['tid'] ]);

        allBundleItems.forEach(function (it, index) {
            let requiredQuant = it['quantity']* backorder['quantity'];

            let actualQuant = alasql('SELECT balance from stock where id=?',[ it['stockid']])[0]['balance'];

            alasql('UPDATE stock SET balance=? where id=?',[actualQuant - requiredQuant, it['stockid'] ]);
            let transId = alasql('SELECT max(id)+1 as max_id from trans')[0]['max_id'];
            alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
                [ transId , it['stockid'] , today , requiredQuant*(-1) , actualQuant - requiredQuant , 'Sold' ]);

        });

        alasql('UPDATE customerorder SET isbackorder=-1 where id=?',[backorder['id']]);



    }
    if(backorder['type'] === 'free')
    {

        let promotionFreeDetails = alasql('SELECT * from promotionfree where id=?',[ backorder['tid']])[0];
        let promotionMasterDetails = alasql('SELECT * from promotionmaster where id=?',[promotionFreeDetails.pmid])[0];

        let actualVal1 = alasql("SELECT balance from stock where id=?",[promotionFreeDetails.originalstockid])[0]['balance'];
        let actualVal2 = alasql("SELECT balance from stock where id=?",[promotionMasterDetails.obsoletestockid])[0]['balance'];

        alasql('UPDATE stock SET balance=? where id=?',[actualVal1 - backorder['quantity'] , promotionFreeDetails.originalstockid]);
        alasql('UPDATE stock SET balance=? where id=?',[actualVal2 - backorder['quantity'] , promotionMasterDetails.obsoletestockid]);

        let transId = alasql('SELECT max(id)+1 as max_id from trans')[0]['max_id'];
        alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
            [ transId , promotionFreeDetails.originalstockid , today , backorder['quantity']*(-1) , actualVal1 - backorder['quantity'] , 'Sold' ]);

        transId = alasql('SELECT max(id)+1 as max_id from trans')[0]['max_id'];
        alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
            [ transId , promotionMasterDetails.obsoletestockid , today , backorder['quantity']*(-1) , actualVal2 - backorder['quantity'] , 'Sold' ]);



        alasql('UPDATE customerorder SET isbackorder=-1 where id=?',[backorder['id']]);


    }

    alert('Backorder has been delivered to the customer and customer is notified about that .');
    let max_id = alasql('SELECT max(id)+1 AS max_id from customernotify')[0]['max_id'];
    max_id = max_id === undefined ? 1 : max_id;


    alasql('INSERT INTO customernotify VALUES(?,?,?)',[max_id , 'Your backorder #'+backorder['id']+' has been delivered.' ,0 ]);


    window.location.reload(true);





}