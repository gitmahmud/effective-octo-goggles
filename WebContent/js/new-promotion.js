/**
 * Created by rahman_ma-pc on 3/21/2017.
 */
let stockId = parseInt($.url().param('id'));
console.log(stockId);

var stock = alasql('SELECT stock.id, kind.text, item.code, item.maker, item.detail, item.price, \
    stock.maxusage, stock.leadtime , stock.avgdailyusage , stock.maxleadtime, stock.balance, item.pclass \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = 1 and stock.id = ?', [stockId])[0];


$('#new_promotion_stock_id').text(stock.id);
$('#new_promotion_name').text(stock.code);
$('#new_promotion_maker').text(stock.maker);
$('#new_promotion_detail').text(stock.detail);
$('#new_promotion_price').text(stock.price);
$('#new_promotion_quantity').text(stock.balance);
$('#new_promotion_pclass').text(stock.pclass);
$('#discount_original_product_price').text(stock.price);

$('#promotion_selection').change(onPromotionSelection);
$('input[name="discount_type"]').change(onDiscountTypeChanged);


function onPromotionSelection(){

        if($(this).val() === 'discount'){
            $('#promotion_discount').show();
            $('#promotion_bundle').hide();
            $('#promotion_free').hide();

        }

        else  if($(this).val() === 'bundle'){
            $('#promotion_discount').hide();
            $('#promotion_bundle').show();
            $('#promotion_free').hide();

        }
        else  if($(this).val() === 'freeoffer'){
            $('#promotion_discount').hide();
            $('#promotion_bundle').hide();
            $('#promotion_free').show();

        }
        else
        {
            $('#promotion_discount').hide();
            $('#promotion_bundle').hide();
            $('#promotion_free').hide();

        }



}

function onDiscountTypeChanged() {

    if($(this).val() === 'type_price'){

        $('#discount_percentage_form').hide();



    }
    else
    {
        $('#discount_percentage_form').show();


    }

}