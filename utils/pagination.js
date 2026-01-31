/**
 * Застосовує пагінацію до Mongoose query
 * @param {Query} query - Mongoose query
 * @param {number} page - Номер сторінки (починаючи з 1)
 * @param {number} limit - Кількість елементів на сторінку
 * @returns {Query} Query з пагінацією
 */
const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

/**
 * Генерує metadata для пагінації
 * @param {Model} model - Mongoose model
 * @param {Object} filter - Фільтр для запиту
 * @param {number} page - Поточна сторінка
 * @param {number} limit - Елементів на сторінку
 * @param {number} totalDocs - Опціонально: загальна кількість документів (якщо вже порахована)
 * @returns {Promise<Object>} Metadata пагінації
 */
const getPaginationMetadata = async (model, filter, page, limit, totalDocs = null) => {
  const total = totalDocs !== null ? totalDocs : await model.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = { paginate, getPaginationMetadata };
