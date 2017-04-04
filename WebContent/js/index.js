var whouseId = parseInt($.url().param('inv')) || 1;






if (localStorage.getItem("today") === null) {
    localStorage.setItem("today", getDatefromMS(new Date()));
    $('#input_today').val(getDatefromMS(new Date()));
}
else {
    let d = localStorage.getItem("today");
    $('#input_today').val(d);

}
$('#input_today').change(function () {
    localStorage.setItem("today", $('#input_today').val());

});

var today = localStorage.getItem("today");

var obsoleteCount;


// create search box
var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var option = $('<option>');
    option.attr('value', row.id);
    option.text(row.name);
    $('select[name="q1"]').append(option);
}

var rows = alasql('SELECT * FROM kind;');
for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var option = $('<option>');
    option.attr('value', row.id);
    option.text(row.text);
    $('select[name="q2"]').append(option);
}

// get search params
var q1 = parseInt($.url().param('q1') || '0');
$('select[name="q1"]').val(q1);
var q2 = parseInt($.url().param('q2') || '0');
$('select[name="q2"]').val(q2);
var q3 = $.url().param('q3') || '';
$('input[name="q3"]').val(q3);

// build sql
var sql = 'SELECT stock.id, whouse.name, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, \
item.unit , stock.obsoleteperiod , stock.maxusage , stock.leadtime , stock.avgdailyusage , stock.maxleadtime ,stock.isobsolete,\
    stock.reorderstatus\
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE item.code LIKE ? ';

// sql += q1 ? 'AND whouse.id = ' + q1 + ' ' : '';
sql += 'AND whouse.id = ' + whouseId;
sql += q2 ? 'AND kind.id = ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, ['%' + q3 + '%']);

// build html table



//reorder notification
initiateReorderNotification();
initiateObsoleteNotification();
createBackorderNotification();
displayPromotionalProduct();
displayAllProducts();

function initiateReorderNotification() {
    let reorderCount = 0;
    // let reorderLink='reorder.html?q=';
    for (let i = 0; i < stocks.length; i++) {
        if (stocks[i]["isobsolete"] < 2) {
            let currentStockValue = stocks[i]["balance"];
            let safetyStock = stocks[i]["maxusage"] * stocks[i]["maxleadtime"] - stocks[i]["avgdailyusage"] * stocks[i]["leadtime"];
            // console.log('dafety ' + safetyStock);
            let reorderQuantity = stocks[i]["leadtime"] * stocks[i]["avgdailyusage"] + safetyStock;
            stocks[i]['safety_stock'] = safetyStock;
            stocks[i]['backorder_quantity'] = getBackorderQuantity(stocks[i]['id']);
            stocks[i]['reorder_quantity'] = reorderQuantity;

            console.log('reorder ' ,stocks[i]['id'] , reorderQuantity);
            if (currentStockValue <= (reorderQuantity+ stocks[i]['backorder_quantity'] ) && stocks[i]['reorderstatus'] !== 2 ) {
                reorderCount++;
                // reorderLink+=stocks[i]["id"]+','
                // console.log(currentStockValue,reorderQuantity ,stocks[i]['id'], stocks[i]['reorderstatus'],stocks[i]);
                alasql('UPDATE stock SET reorderstatus=1 WHERE id=?', [stocks[i]["id"]]);

            }
        }

    }

    console.log(reorderCount+' r');
    if (reorderCount > 0) {


        $('#reorderId').removeClass('btn-default');
        $('#reorderId').addClass('btn-primary');

        $('#reorderBadge').text(reorderCount);
    }
    else {
        // reorderLink = reorderLink.substr(0, reorderLink.length - 3);
        // $('#reorderId').css('background', '');
        // $('#reorderId').children(':first-child').attr('href',reorderLink);
        $('#reorderId').addClass('btn-default');
        $('#reorderId').removeClass('btn-primary');

        $('#reorderBadge').text('');

    }


}

function initiateObsoleteNotification() {
    obsoleteCount = 0;

    for (let i = 0; i < stocks.length; i++) {
       // console.log(stocks[i]);
        if (stocks[i]["isobsolete"] < 2) {

            let maxLastSaleDate = new Date(getMSFromDate(today));
            let currentStockObsoletePeriod = stocks[i]["obsoleteperiod"];
            maxLastSaleDate.setDate(maxLastSaleDate.getDate() - currentStockObsoletePeriod);
            maxLastSaleDate = getDatefromMS(maxLastSaleDate);
            let lastSale = alasql('SELECT last(date) AS last_sale from trans where (memo = "Sold" or memo = "Initial Stock") and stock = ?', [stocks[i]["id"]])[0]["last_sale"];

            if (lastSale < maxLastSaleDate) {
                obsoleteCount++;
                alasql('UPDATE stock SET isobsolete=1 WHERE id=?', [stocks[i]["id"]]);
            }
            else
            {
                alasql('UPDATE stock SET isobsolete=0 WHERE id=?', [stocks[i]["id"]]);
            }
            console.log(stocks[i]['id'] ,obsoleteCount, maxLastSaleDate, lastSale , currentStockObsoletePeriod);
        }

    }
    console.log(obsoleteCount);

    if (obsoleteCount > 0) {

        $('#obsoleteNotificationId').removeClass('btn-default');
        $('#obsoleteNotificationId').addClass('btn-danger');
        $('#obsoleteBadge').text(obsoleteCount);

    }
    else {
        $('#obsoleteNotificationId').removeClass('btn-danger');
        $('#obsoleteNotificationId').addClass('btn-default');
        $('#obsoleteBadge').text('');


    }

}
function displayPromotionalProduct() {
    let currentPromotions = alasql("SELECT * from promotionmaster where enddate = ''");
    let str = '';
    let totalDiscount = 0;
    let totalBundle = 0;
    let totalFree = 0;


    currentPromotions.forEach(function (currentPromotion) {
        let stock = stocks.find(function (s) {
            // console.log(s.id,currentPromotion.obsoletestockid);
            return s.id === currentPromotion.obsoletestockid;
        });

        if(currentPromotion.type === 'discount')
        {
            totalDiscount +=1;
        }
        if(currentPromotion.type === 'bundle')
        {
            totalBundle +=1;
        }
        if(currentPromotion.type === 'free')
        {
            totalFree +=1;
        }

        let rowColor = currentPromotion.type === 'discount' ? 'primary' : (currentPromotion.type === 'bundle' ? 'success' : 'info');
        str += '<tr  class="' + rowColor + '" data-href="promotion.html?id=' + stock.id + '">' +
            '<td>' + stock.code + '</td>' +
            '<td>' + stock.detail + '</td>' +
            '<td>' + stock.balance + '</td>' +
            '<td class="text-capitalize">' + currentPromotion.type + '</td>' +
            '<td>' + currentPromotion.startdate + '</td>' +
            '</tr>';
    });

    $('#tbody_promotional_list').html(str);

    $('#totalDiscountProduct').text(totalDiscount);
    $('#totalBundleProduct').text(totalBundle);
    $('#totalFreeProduct').text(totalFree);


    $('tbody > tr').css('cursor', 'pointer').on('click', function () {
        //alert( $(this).attr('data-href'))
        window.location.replace($(this).attr('data-href'));
    });


}
function displayAllProducts() {

    let currentObsolete = alasql('SELECT * from stock where isobsolete>=2');
    let currentReorder = alasql('SELECT * from stock where reorderstatus=2');
    let missingExpectedDateProducts = alasql('SELECT stockid from reorderproduct where status != "PRODUCT SCRUTINIZED"' +
        'and status != "ORDER RECEIVED" and expectedreceivedate < ?',[ today ]);

    $('#totalProduct').text(stocks.length);
    $('#totalObsoleteProduct').text(currentObsolete.length);
    $('#currentReorderProduct').text(currentReorder.length);

    $('#missingExpectedDateProducts').text(missingExpectedDateProducts.length);



    var tbody = $('#tbody-stocks');
    for (var i = 0; i < stocks.length; i++) {
        var stock = stocks[i];

        let bgRow = '';
        let obsoleteIndex = currentObsolete.findIndex(function (it) {
            return it.id === stock['id'];
        });
        if(obsoleteIndex !== -1)
        {
            bgRow = 'danger';
        }
        let reorderIndex = currentReorder.findIndex(function (it) {
            return it.id === stock['id'];
        });
        if(reorderIndex !== -1)
        {
            bgRow = 'success';

        }

        let ttt = missingExpectedDateProducts.findIndex(function (it) {
            return it.stockid === stock['id'];
        }) ;

        if(ttt !== -1)
        {
            bgRow = 'warning';
        }



        var tr = $('<tr data-href="stock.html?id=' + stock.id + '" class="'+bgRow+'"></tr>');
        tr.append('<td>' + stock.id + '</td>');
        tr.append('<td>' + stock.code + '</td>');
        tr.append('<td>' + stock.text + '</td>');
        tr.append('<td>' + stock.maker + '</td>');
        tr.append('<td>' + stock.detail + '</td>');
        tr.append('<td style="text-align: right;">' + numberWithCommas(stock.price) + '</td>');
        tr.append('<td style="text-align: right;font-weight: bold" >' + stock.balance + '</td>');
        tr.append('<td style="text-align: right">' + (stock.safety_stock === undefined? '': stock.safety_stock) + '</td>');
        tr.append('<td style="text-align: right">' + (stock.backorder_quantity === undefined ?'' : stock.backorder_quantity) + '</td>');
        tr.append('<td style="text-align: right;font-weight: bold">' + (stock.reorder_quantity === undefined?'':stock.reorder_quantity)  + '</td>');
        tr.append('<td>' + stock.unit + '</td>');
        tr.appendTo(tbody);

    }



// click event
    $('tbody > tr').css('cursor', 'pointer').on('click', function () {
        window.location = $(this).attr('data-href');
    });

}

function createBackorderNotification() {


    let allBackorders = alasql("SELECT * from customerorder where  isbackorder=2");


    console.log(allBackorders);

    allBackorders.forEach(function (backorder, index) {

        if(backorder['type'] === 'stock')
        {
            let actualVal = alasql('SELECT balance from stock where id=?',[backorder['tid']])[0]['balance'];
            if(actualVal > backorder['quantity'])
            {

                alasql("UPDATE customerorder SET isbackorder=3 where id=?",[ backorder['id'] ]);

            }


        }
        if(backorder['type'] === 'bundle'){

            let allBundleItems = alasql('SELECT * from bundleitems where id=?',[ backorder['tid'] ]);
            let flag = true;
            allBundleItems.forEach(function (it, index) {
                let requiredQuant = it['quantity']* backorder['quantity'];

                let actualQuant = alasql('SELECT balance from stock where id=?',[ it['stockid']])[0]['balance'];

                if(requiredQuant > actualQuant)
                {
                    flag = false;
                }

            });

            if(flag)
            {

                alasql("UPDATE customerorder SET isbackorder=3 where id=?",[ backorder['id'] ]);
            }


        }

        if(backorder['type'] === 'free')
        {
            console.log('here');

            let promotionFreeDetails = alasql('SELECT * from promotionfree where id=?',[ backorder['tid']])[0];
            let promotionMasterDetails = alasql('SELECT * from promotionmaster where id=?',[promotionFreeDetails.pmid])[0];

            let actualVal1 = alasql("SELECT balance from stock where id=?",[promotionFreeDetails.originalstockid])[0]['balance'];
            let actualVal2 = alasql("SELECT balance from stock where id=?",[promotionMasterDetails.obsoletestockid])[0]['balance'];


            if(actualVal1 >= backorder['quantity'] && actualVal2 >= backorder['quantity'])
            {

                alasql("UPDATE customerorder SET isbackorder=3 where id=?",[ backorder['id'] ]);

            }

        }

    });

    let totalBackorders = alasql('SELECT * from customerorder where isbackorder=3').length;
    if(totalBackorders >0)
    {
        $('#backorderTotal').text(totalBackorders);

    }
    else {
        $('#backorderTotal').text('');
    }




}

function getBackorderQuantity(stockid) {

    let allBackorders = alasql("SELECT * from customerorder where  isbackorder=2");


    //console.log(allBackorders);
    let totalBackorderQuant = 0;

    allBackorders.forEach(function (backorder, index) {

        if(backorder['type'] === 'stock' && backorder['tid'] === stockid )
        {
            totalBackorderQuant += backorder['quantity'];
        }
        if(backorder['type'] === 'bundle'){

            let allBundleItems = alasql('SELECT * from bundleitems where id=?',[ backorder['tid']  ]);
            allBundleItems.forEach(function (it, index) {
                if(it['stockid'] ===  stockid) {
                    totalBackorderQuant += (it['quantity'] * backorder['quantity']);
                }

            });

        }

        if(backorder['type'] === 'free')
        {
            // console.log('here');

            let promotionFreeDetails = alasql('SELECT * from promotionfree where id=?',[ backorder['tid']])[0];
            let promotionMasterDetails = alasql('SELECT * from promotionmaster where id=?',[promotionFreeDetails.pmid])[0];


            if(promotionMasterDetails.originalstockid === stockid || promotionMasterDetails.obsoletestockid)
            {
                totalBackorderQuant += backorder['quantity'];
            }

        }

    });

    return totalBackorderQuant;
}




function getDatefromMS(currentDate) {
    currentDate = new Date(currentDate);
    return currentDate.getFullYear() + '-' + (currentDate.getMonth() >= 9 ? '' : '0') + (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() > 9 ? '' : '0') + currentDate.getDate();


}
function getMSFromDate(currentDate) {
    let arr = currentDate.split('-');
    let d = Date.UTC(parseInt(arr[0]), parseInt(arr[1]) - 1, parseInt(arr[2]));

    return d;

}





function onSearchClicked() {
    let q1val = $('select[name="q1"]').val();
    let q2val = $('select[name="q2"]').val();
    let q3val = $('input[name="q3"]').val();

    window.location.replace('index.html?inv=1&q1=' + q1val + '&q2=' + q2val + '&q3=' + q3val);


}
function onClickReorderNotification() {

    window.location.replace('reorder.html');
}
function onClickObsoleteNotification() {
    window.location.replace('obsolete.html');

}






















