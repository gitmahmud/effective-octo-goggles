var whouseId = parseInt($.url().param('inv'));

if(localStorage.getItem("today") === null)
{
    localStorage.setItem("today" , getDatefromMS(new Date()));
    $('#input_today').val(getDatefromMS(new Date()));
}
else
{
    let d = localStorage.getItem("today");
    $('#input_today').val(d);

}
$('#input_today').change(function () {
    localStorage.setItem("today" ,$('#input_today').val() );

});




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
item.unit , stock.obsoleteperiod , stock.maxusage , stock.leadtime , stock.avgdailyusage , stock.maxleadtime \
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
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
    var stock = stocks[i];
    var tr = $('<tr data-href="stock.html?id=' + stock.id + '"></tr>');
    tr.append('<td>' + stock.name + '</td>');
    tr.append('<td>' + stock.text + '</td>');
    tr.append('<td>' + stock.code + '</td>');
    tr.append('<td>' + stock.maker + '</td>');
    tr.append('<td>' + stock.detail + '</td>');
    tr.append('<td style="text-align: right;">' + numberWithCommas(stock.price) + '</td>');
    tr.append('<td style="text-align: right;">' + stock.balance + '</td>');
    tr.append('<td>' + stock.unit + '</td>');
    tr.appendTo(tbody);
}

// click event
$('tbody > tr').css('cursor', 'pointer').on('click', function () {
    window.location = $(this).attr('data-href');
});






//reorder notification
initiateReorderNotification();
initiateObsoleteNotification();
displayPromotionalProduct();

function initiateReorderNotification() {
    let reorderCount = 0;
    // let reorderLink='reorder.html?q=';
    for (let i = 0; i < stocks.length; i++) {
        if (stocks[i]["isobsolete"] !== 2) {
            let currentStockValue = stocks[i]["balance"];
            let safetyStock = stocks[i]["maxusage"] * stocks[i]["maxleadtime"] - stocks[i]["avgdailyusage"] * stocks[i]["leadtime"];
            // console.log('dafety ' + safetyStock);
            let reorderQuantity = stocks[i]["leadtime"] * stocks[i]["avgdailyusage"] + safetyStock;

            // console.log('reorder ' + reorderQuantity);
            if (currentStockValue <= reorderQuantity) {
                reorderCount++;
                // reorderLink+=stocks[i]["id"]+','
                alasql('UPDATE stock SET reorderstatus=1 WHERE id=?', [stocks[i]["id"]]);

            }
        }

    }

    if (reorderCount > 0) {
        // reorderLink = reorderLink.substr(0, reorderLink.length - 1);
        $('#reorderId').css('background', 'green');
        // $('#reorderId').children(':first-child').attr('href',reorderLink);
        $('#reorderId').children(':first-child').children(':last-child').text(reorderCount);
    }
    else {
        // reorderLink = reorderLink.substr(0, reorderLink.length - 3);
        $('#reorderId').css('background', '');
        // $('#reorderId').children(':first-child').attr('href',reorderLink);
        $('#reorderId').children(':first-child').children(':last-child').text('');

    }


}

function initiateObsoleteNotification() {
    let obsoleteCount = 0;

    for (let i = 0; i < stocks.length; i++) {
        if (stocks[i]["isobsolete"] !== 2) {
            let maxLastSaleDate = new Date();
            let currentStockObsoletePeriod = stocks[i]["obsoleteperiod"];
            maxLastSaleDate.setDate(maxLastSaleDate.getDate() - currentStockObsoletePeriod);
            maxLastSaleDate = getDatefromMS(maxLastSaleDate);
            let lastSale = alasql('SELECT last(date) AS last_sale from trans where (memo = "Sold" or memo = "Initial Stock") and stock = ?', [stocks[i]["id"]])[0]["last_sale"];

            if (lastSale < maxLastSaleDate) {
                obsoleteCount++;
                alasql('UPDATE stock SET isobsolete=1 WHERE id=?', [stocks[i]["id"]]);
            }
            // console.log(obsoleteCount, maxLastSaleDate, lastSale);
        }

    }
    // console.log(obsoleteCount);

    if (obsoleteCount > 0) {
        $('#obsoleteNotificationId').css('background', 'blue');
        $('#obsoleteNotificationId').children(':first-child').children(':last-child').text(obsoleteCount);
    }
    else {
        // reorderLink = reorderLink.substr(0, reorderLink.length - 3);
        $('#obsoleteNotificationId').css('background', '');
        // $('#reorderId').children(':first-child').attr('href',reorderLink);
        $('#obsoleteNotificationId').children(':first-child').children(':last-child').text('');


    }


}
function displayPromotionalProduct() {
    let currentPromotions = alasql("SELECT * from promotionmaster where enddate = ''");
    let str = '';

    currentPromotions.forEach(function (currentPromotion) {
        let stock = stocks.find(function (s) {
            // console.log(s.id,currentPromotion.obsoletestockid);
            return s.id === currentPromotion.obsoletestockid;
        });
        let rowColor =  currentPromotion.type === 'discount' ? 'primary' : (currentPromotion.type === 'bundle' ? 'success' : 'info');
        str += '<tr  class="'+ rowColor+'" data-href="promotion.html?id=' + stock.id + '">'+
                '<td>'+ stock.code +'</td>'+
                '<td>'+ stock.detail +'</td>'+
                '<td>'+ stock.balance +'</td>'+
                '<td class="text-capitalize">'+ currentPromotion.type +'</td>'+
                '<td>'+ currentPromotion.startdate +'</td>'+
            '</tr>';
    });

    $('#tbody_promotional_list').html(str);

    $('tbody > tr').css('cursor', 'pointer').on('click', function () {
        alert( $(this).attr('data-href'))
        window.location.replace( $(this).attr('data-href'));
    });





}

function getDatefromMS(currentDate) {
    currentDate = new Date(currentDate);
    return currentDate.getFullYear() + '-' + (currentDate.getMonth() >= 9 ? '' : '0') + (currentDate.getMonth() + 1) + '-' + (currentDate.getDate() >= 9 ? '' : '0') + currentDate.getDate();


}
























