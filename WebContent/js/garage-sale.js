/**
 * Created by rahman_ma-pc on 3/29/2017.
 */

var allGarageItems = alasql('SELECT * from garagesale where done = 0');


for(let i = 0 ; i<allGarageItems.length ; i++)
{
    let currentProduct = alasql('SELECT *  from stock JOIN item ON stock.item = item.id where stock.id=?',[ allGarageItems[i]['stockid'] ] )[0];

    let str ='<tr>';
    str+= '<td>'+ (i+1) +'</td>';
    str+= '<td>'+ currentProduct['code'] +'</td>';
    str+= '<td>'+ allGarageItems[i]['quantity'] +'</td>';
    str+= '<td>'+ allGarageItems[i]['dateadded'] +'</td>';
    str+='</tr>';

    $('#garage_sale_table').append(str);




}


function onClickSold() {

    $('#modalSoldGarage').modal('show');
}

function onClickSoldDone() {

    $('#modalSoldGarage').modal('hide');

    let originalTotal = 0;



    for(let i = 0 ; i<allGarageItems.length ; i++)
    {
        let currentProduct = alasql('SELECT *   from stock JOIN item ON stock.item = item.id where stock.id=?',[ allGarageItems[i]['stockid'] ])[0];

        let str ='<tr>';
        str+= '<td>'+ (i+1) +'</td>';
        str+= '<td>'+ currentProduct['code'] +'</td>';
        str+= '<td>'+ allGarageItems[i]['quantity'] +'</td>';
        str+= '<td>'+ currentProduct['balance'] +'</td>';
        str+='</tr>';

        originalTotal += currentProduct['price'] * allGarageItems[i]['quantity'];

        $('#garage_sale_report').append(str);

    }

    let totalReceivedAmount = parseInt($('#input_total_garage_amount').val());



    $('#originalTotal').text(originalTotal);
    $('#totalReceivedAmount').text(totalReceivedAmount);
    $('#net_loss').text((originalTotal - totalReceivedAmount));






    $('#modalGarageReport').modal('show');





}

function onClickGarageReportDone() {

    for(let i = 0 ; i<allGarageItems.length ; i++)
    {
        alasql('UPDATE garagesale SET done = 1 where id=?',[allGarageItems[i]['id']]);
    }

    window.location.replace('index.html?inv=1');






}