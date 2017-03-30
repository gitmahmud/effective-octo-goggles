/**
 * Created by rahman_ma-pc on 3/27/2017.
 */



let activeOrders = alasql("SELECT * from customerorder where isbackorder = 0 or isbackorder = 1");
let today = localStorage.getItem('today');


for (let i = 0; i < activeOrders.length; i++) {
    let name = '';

    if (activeOrders[i]["type"] === 'stock') {

        console.log(activeOrders[i]);
        name = alasql('SELECT item.code from stock JOIN item ON item.id = stock.item where stock.id=?', [activeOrders[i]["tid"]])[0]["code"];

        console.log(name);

    }
    else if (activeOrders[i]["type"] === 'free') {
        let sid = alasql('SELECT * from promotionfree where id=? ', [activeOrders[i]["tid"]])[0]["originalstockid"];
        console.log(sid);
        name = alasql('SELECT item.code from stock JOIN item ON item.id = stock.item where stock.id=?', [sid])[0]["code"];

    }
    else {

        name = alasql('SELECT * from promotionbundle where id =?', [activeOrders[i]["tid"]])[0]["name"];

    }

    let str = '<tr>';
    str += '<td>' + activeOrders[i]["id"] + '</td>';
    str += '<td>' + name + '</td>';
    str += '<td>' + activeOrders[i]["type"] + '</td>';
    str += '<td>' + activeOrders[i]["quantity"] + '</td>';
    str += '<td>' + (activeOrders[i]["isbackorder"] === 0 ? 'Regular' : 'Backorder') + '</td>';

    str += '<td><button class="btn btn-primary "  id="receive_button_index_' + i + '">Serve</button></td>'

    $('#tbody_orders').append(str);


}
$('button[id^="receive_button_index_"]').on('click', onClickOrderServe);

function onClickOrderServe() {
    //console.log($(this));
    let arr = $(this).attr('id').split('_');
    let activeOrderIndex = parseInt(arr[arr.length - 1]);

    if (activeOrders[activeOrderIndex]["isbackorder"] === 1) {
        alert("Backorder has been taken . You will be notified about the backorder when reordering this product.");
        alasql('UPDATE customerorder SET isbackorder = 2 where id=?', [activeOrders[activeOrderIndex]["id"]]);
        window.location.reload(true);

    }
    else {
        if (activeOrders[activeOrderIndex]["type"] === 'bundle') {

            let allBundleItems = alasql('SELECT * from bundleitems where pbid = ? ', [activeOrders[activeOrderIndex]['tid']]);


            let flag = false;
            for (let i = 0; i < allBundleItems.length; i++) {
                let currentVal = alasql("SELECT balance from stock where id = ?", [allBundleItems[i]['stockid']])[0]["balance"];
                let totalOrderQuantity = allBundleItems[i]['quantity'] * activeOrders[activeOrderIndex]['quantity'];

                if (currentVal < totalOrderQuantity) {
                    flag = true;
                    break;

                }

            }


            if (flag) {


                alert("Sufficient inventory for this order is not available .A reorder notification has been created for reordering later. You can see this notification at your landing page.");
                window.location.reload(true);


            }
            else {

                for (let i = 0; i < allBundleItems.length; i++) {

                    let currentVal = alasql("SELECT balance from stock where id = ?", [allBundleItems[i]['stockid']])[0]["balance"];
                    let totalOrderQuantity = allBundleItems[i]['quantity'] * activeOrders[activeOrderIndex]['quantity'];

                    alasql("UPDATE stock SET balance = ? where id=?",
                        [currentVal - totalOrderQuantity, allBundleItems[i]['stockid']]);

                    let transId = alasql('SELECT max(id)+1 AS max_id from trans')[0]['max_id'];
                    alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
                        [transId, allBundleItems[i]['stockid'],
                            today,
                            totalOrderQuantity * (-1),
                            currentVal - totalOrderQuantity,
                            'Sold'
                        ]);


                }

                alasql('UPDATE customerorder SET isbackorder = -1 where id=?', [activeOrders[activeOrderIndex]["id"]]);

                alert('Order has been served.');
                window.location.reload(true);


            }


        }
        else if (activeOrders[activeOrderIndex]["type"] === 'free') {
            let arr = alasql('SELECT * from promotionfree where id=?',[activeOrders[activeOrderIndex]['tid'] ])[0];
            let arr2 = alasql('SELECT * from promotionmaster where id=?',[ arr['pmid']])[0];


            let originalProductOrderQuantity = arr['quantity'] * activeOrders[activeOrderIndex]['quantity'];
            let freeProductOrderQuantity = activeOrders[activeOrderIndex]['quantity'];


            let originalProductCurrentVal = alasql('SELECT balance from stock where id=?',[ arr['originalstockid'] ])[0]['balance'];
            let freeProductCurrentVal = alasql('SELECT balance from stock where id=?',[arr2['obsoletestockid'] ])[0]['balance'];

            if(originalProductCurrentVal < originalProductOrderQuantity || freeProductCurrentVal < freeProductOrderQuantity)
            {

                alert("Sufficient inventory for this order is not available .A reorder notification has been created for reordering later. You can see this notification at your landing page.");
                window.location.reload(true);

            }
            else
            {


                alasql("UPDATE stock SET balance = ? where id=?",
                    [ originalProductCurrentVal - originalProductOrderQuantity, arr['originalstockid'] ]);

                let transId = alasql('SELECT max(id)+1 AS max_id from trans')[0]['max_id'];

                alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
                    [transId, arr['originalstockid'],
                        today,
                        originalProductOrderQuantity * (-1),
                        originalProductCurrentVal - originalProductOrderQuantity,
                        'Sold'
                    ]);


                alasql("UPDATE stock SET balance = ? where id=?",
                    [ freeProductCurrentVal - freeProductOrderQuantity, arr2['obsoletestockid'] ]);

                transId = alasql('SELECT max(id)+1 AS max_id from trans')[0]['max_id'];

                alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
                    [transId, arr2['obsoletestockid'],
                        today,
                        freeProductOrderQuantity * (-1),
                        freeProductCurrentVal - freeProductOrderQuantity,
                        'Sold'
                    ]);

                alasql('UPDATE customerorder SET isbackorder = -1 where id=?', [activeOrders[activeOrderIndex]["id"]]);

                alert('Order has been served.');
                window.location.reload(true);


            }





        }
        else {
            let currentVal = alasql("SELECT balance from stock where id = ?", [activeOrders[activeOrderIndex]["tid"]])[0]["balance"];

            if (activeOrders[activeOrderIndex]["quantity"] <= currentVal) {
                alasql("UPDATE stock SET balance = ? where id=?",
                    [currentVal - activeOrders[activeOrderIndex]["quantity"], activeOrders[activeOrderIndex]["tid"]]);

                let transId = alasql('SELECT max(id)+1 AS max_id from trans')[0]['max_id'];
                alasql('INSERT INTO trans VALUES(?,?,?,?,?,?)',
                    [transId, activeOrders[activeOrderIndex]["tid"],
                        today,
                        activeOrders[activeOrderIndex]["quantity"] * (-1),
                        currentVal - activeOrders[activeOrderIndex]["quantity"],
                        'Sold'
                    ]);

                alasql('UPDATE customerorder SET isbackorder = -1 where id=?', [activeOrders[activeOrderIndex]["id"]]);

                let flag = confirm("Order has been served . Do you want to see current inventory level for this product ? ");

                if (flag) {

                    window.open('stock.html?id=' + activeOrders[activeOrderIndex]["tid"], '_blank');


                }
                window.location.reload(true);

            }
            else {
                if (confirm("Sufficient inventory for this order is not available . DO you want to reorder now ? ")) {
                    window.open('reorder-form.html?id=' + activeOrders[activeOrderIndex]["tid"], '_blank');
                    window.location.reload(true);
                }
                else {
                    alert("A reorder notification has been created for reordering later. You can see this notification at your landing page.");
                    window.location.reload(true);

                }


            }


        }


    }


}

function generateDummyData() {
    let dates = ['2017-02-07',
        '2017-02-10', '2017-02-12', '2017-02-18', '2017-02-20', '2017-02-22', '2017-02-26',
        '2017-03-01', '2017-03-02', '2017-03-05', '2017-03-07',
        '2017-03-10', '2017-03-12', '2017-03-18', '2017-03-20', '2017-03-22', '2017-03-26',
        '2017-03-28'];
    console.log(dates.length);

    let balance = [0, 3, 60, 20, 10, 14, 20, 17, 12, 18, 15, 19, 36, 24, 30];
    let res = '';

    for (let i = 0; i < dates.length; i++) {
        for (let j = 1; j <= 15; j++) {
            if (balance[j - 1] < 20) {
                res += j + '\t' + 'purchaseddate' + '\t';

                let buy_quant = Math.floor((Math.random() * 150) + 1);
                balance[j - 1] = balance[j - 1] + buy_quant;
                res += buy_quant + '\t' + balance[j - 1] + '\t' + 'Purchased' + '\n';


            }


        }


        for (let j = 1; j <= 15; j++) {
            res += j + '\t' + dates[i] + '\t';

            let sold_quant = Math.floor((Math.random() * balance[j - 1]) + 1);
            balance[j - 1] = balance[j - 1] - sold_quant;
            res += '-' + sold_quant + '\t' + balance[j - 1] + '\t' + 'Sold' + '\n';

        }

    }
    console.log(res);

}
