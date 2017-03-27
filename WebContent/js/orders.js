/**
 * Created by rahman_ma-pc on 3/27/2017.
 */



let activeOrders = alasql("SELECT * from customerorder where isbackorder = 0 or isbackorder = 1");




for(let i = 0 ; i < activeOrders.length ; i++)
{
    let name = '';

    if(activeOrders[i]["type"] === 'stock'){

        console.log(activeOrders[i] );
        name = alasql('SELECT item.code from stock JOIN item ON item.id = stock.item where stock.id=?',[ activeOrders[i]["tid"] ] )[0]["code"];

        console.log(name);

    }
    else if (activeOrders[i]["type"] === 'free')
    {
        let sid  = alasql('SELECT * from promotionfree where id=? ',[ activeOrders[i]["tid"] ] )[0]["originalstockid"];
        console.log(sid);
        name = alasql('SELECT item.code from stock JOIN item ON item.id = stock.item where stock.id=?',[sid] )[0]["code"];

    }
    else
    {

        name = alasql('SELECT * from promotionbundle where id =?',[activeOrders[i]["tid"]] )[0]["name"];

    }

    let str = '<tr>';
    str += '<td>'+ activeOrders[i]["id"] +'</td>';
    str += '<td>'+ name +'</td>';
    str += '<td>'+ activeOrders[i]["type"] +'</td>';
    str += '<td>'+ activeOrders[i]["quantity"] +'</td>';
    str += '<td>'+ (activeOrders[i]["isbackorder"] === 0 ? 'Regular' : 'Backorder') +'</td>';

    str += '<td><button class="btn btn-primary "  id="receive_button_index_'+ i +'">Serve</button></td>'

    $('#tbody_orders').append(str);


}
$('button[id^="receive_button_index_"]').on('click' , onClickOrderServe);

function onClickOrderServe() {
    //console.log($(this));
    let arr = $(this).attr('id').split('_');
    let activeOrderIndex = parseInt(arr[arr.length - 1]) ;

    if(activeOrders[activeOrderIndex]["isbackorder"] === 1){
        alert("Backorder has been taken . You will be notified about the backorder when reordering this product.");
        alasql('UPDATE customerorder SET isbackorder = 2 where id=?',[activeOrders[activeOrderIndex]["id"]]);

    }
    else{


    }

    window.location.reload(true);

}


