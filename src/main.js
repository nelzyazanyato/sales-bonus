/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  // purchase — это одна из записей в поле items из чека в data.purchase_records
  // _product — это продукт из коллекции data.products
  const discount = 1 - purchase.discount / 100;
  return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  if (index === 0) {
    return 0.15;
  } else if (index === 1 || index === 2) {
    return 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return 0.05;
  }
}
/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }

  if (typeof options !== "object") {
    throw new Error("Некорректные опции");
  }
  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;

  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Чего-то не хватает");
  }

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Переданные опции должны быть функциями");
  }

  // Сюда передадим функции для расчёто
  // Здесь посчитаем промежуточные данные и отсортируем продавцов

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    // Заполним начальными данными
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller])
  );
  const productIndex = Object.fromEntries(
    data.products.map((products) => [products.sku, products])
  );
  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    if (seller) {
      seller.sales_count = (seller.sales_count || 0) + 1; // Увеличить количество продаж
      seller.revenue = (seller.revenue || 0) + record.total_amount; // Увеличить общую сумму всех продаж

      // Расчёт прибыли для каждого товара
      record.items.forEach((item) => {
        const product = productIndex[item.sku]; // Товар
        const cost = product.purchase_price * item.quantity; // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
        const revenue = calculateRevenue(item, product); // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
        const profit = revenue - cost; // Посчитать прибыль: выручка минус себестоимость
        seller.profit = seller.profit + profit; // Увеличить общую накопленную прибыль (profit) у продавца

        // Учёт количества проданных товаров
        if (!seller.products_sold[item.sku]) {
          seller.products_sold[item.sku] = 0;
        }
        // По артикулу товара увеличить его проданное количество у продавца
      });
    }
  });

  sellerStats.sort((a, b) => b.profit - a.profit); // @TODO: Сортировка продавцов по прибыли

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller); // Считаем бонус
    // Формируем топ-10 товаров
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }); // @TODO: Назначение премий на основе ранжирования

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
  })); // Сформируем и вернём отчёт
}
