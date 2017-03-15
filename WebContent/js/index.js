

var whouseId = parseInt($.url().param('inv'));
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
sql +=  'AND whouse.id = ' + whouseId ;
sql += q2 ? 'AND kind.id = ' + q2 + ' ' : '';

// send query
var stocks = alasql(sql, [ '%' + q3 + '%' ]);

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
$('tbody > tr').css('cursor', 'pointer').on('click', function() {
	window.location = $(this).attr('data-href');
});


//reorder notification
initiateReorderNotification();

function initiateReorderNotification() {
    let reorderCount = 0;
    // let reorderLink='reorder.html?q=';
    for (let i = 0; i < stocks.length; i++) {
        let currentStockValue = stocks[i]["balance"];
        let safetyStock = stocks[i]["maxusage"] * stocks[i]["maxleadtime"] - stocks[i]["avgdailyusage"] * stocks[i]["leadtime"] ;
        console.log('dafety '+safetyStock);
        let reorderQuantity = stocks[i]["leadtime"] * stocks[i]["avgdailyusage"] + safetyStock;

        console.log('reorder '+reorderQuantity);
        if(currentStockValue <= reorderQuantity)
		{
			reorderCount++;
			// reorderLink+=stocks[i]["id"]+','
			alasql('UPDATE stock SET reorderstatus=1 WHERE id=?', [stocks[i]["id"]] );

		}

    }

    if(reorderCount >0) {
        // reorderLink = reorderLink.substr(0, reorderLink.length - 1);
        $('#reorderId').css('background' , 'green');
        // $('#reorderId').children(':first-child').attr('href',reorderLink);
        $('#reorderId').children(':first-child').children(':last-child').text(reorderCount);
    }
    else {
        // reorderLink = reorderLink.substr(0, reorderLink.length - 3);
        $('#reorderId').css('background' , '');
        // $('#reorderId').children(':first-child').attr('href',reorderLink);
        $('#reorderId').children(':first-child').children(':last-child').text('');

    }


}

























