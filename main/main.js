'use strict';

function printReceipt(inputs) {
  const allItems = loadAllItems();
  let promotions = loadPromotions();

  const targetItems = parseInputDataset(inputs)
    .map(({ barcode, count }) => {
      const item = findItemByBarcode(barcode, allItems);
      return item ? { ...item, count } : undefined;
    })
    .filter(item => item !== undefined);

  const calculatedItems = calculateItems(targetItems, promotions);

  const receiptString = formatToReceipt(calculatedItems);
  printOut(receiptString);
}

function parseInputDataset(inputs) {
  const parseSingleInputData = value => {
    const barcodeAndCount = value.split('-');
    return { barcode: barcodeAndCount[0], count: barcodeAndCount[1] ? barcodeAndCount[1] : 1 }
  };

  return inputs.map(value => parseSingleInputData(value));
}

function printOut(message) {
  console.log(message);
}

function formatToReceipt({total, save, items}) {
  const formatSingleItem = ({ name, count, unit, price, total }) =>
    `名称：${name}，数量：${count}${unit}，单价：${price.toFixed(2)}(元)，` +
    `小计：${total.toFixed(2)}(元)\n`;

  const itemListView = items.map(item => formatSingleItem(item)).join('');

  return '***<没钱赚商店>收据***\n' +
    `${itemListView}` +
    '----------------------\n' +
    `总计：${total.toFixed(2)}(元)\n` +
    `节省：${save.toFixed(2)}(元)\n` +
    '**********************';
}

function calculateItems(originalItems, promotions) {
  let hash = {};
  let savedPrice = 0;
  let totalPrice = 0;

  originalItems.forEach(({ barcode, price, count, ...otherProps }) => {
    const nextCount = hash[barcode] ? hash[barcode].count + count : count;
    const {total, save} = calculatePriceWithPromotion({ price, count: nextCount, barcode }, promotions);
    savedPrice += save;
    totalPrice += total;

    hash[barcode] = {
      barcode,
      price: price,
      count: nextCount,
      total: total,
      ...otherProps,
    }
  });

  return {items: Object.values(hash), save: savedPrice, total: totalPrice};
}

function getPromotionSolution(promotionType) {
  const PROMOTION_SOLUTION = {
    BUY_TWO_GET_ONE_FREE: (price, count) => {
      const promotedCount = Math.floor(count / 3);
      const finalCount = count - promotedCount;
      return price * finalCount;
    }
  };

  return PROMOTION_SOLUTION[promotionType];
}

function calculatePriceWithPromotion({ price, count, barcode }, promotions) {
  const PROMOTION_TYPE_BUY_TWO_GET_ONE_FREE = 'BUY_TWO_GET_ONE_FREE';
  const targetPromotion = promotions.find(promotion => promotion.type === PROMOTION_TYPE_BUY_TWO_GET_ONE_FREE);

  const promotionSolution = getPromotionSolution(PROMOTION_TYPE_BUY_TWO_GET_ONE_FREE);
  const shouldPromote = barcode => targetPromotion.barcodes.includes(barcode);

  return shouldPromote(barcode) ? promotionSolution(price, count) : price * count;
}

function findItemByBarcode(barcode, storage) {
  return storage.find(item => barcode === item.barcode);
}
