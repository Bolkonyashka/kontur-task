/**
 * @typedef {Object} Comment Структурированный комментарий
 * @property {Number} id - id комментария
 * @property {Number} importance - количество восклицтельных знаков в тексте
 * @property {String} user - создатель комментария
 * @property {String} date - дата создания
 * @property {String} text - текст комментария
 * @property {String} file - файл, в котором комментарий написан
 */

/**
 * @typedef {Object} Config Конфигурация с данными для вывода таблицы
 * @property {Number} userLength - ширина колонки "user"
 * @property {Number} dateLength - ширина колонки "date"
 * @property {Number} commentLength - ширина колонки "comment"
 * @property {Number} fileNameLength - ширина колонки "fileName"
 * @property {Number} fullLength - ширина разделяющей пунктирной полосы
 */

/**
 * Находит максимум двух чисел, но не больший предела
 * @param {Number} first Первое число
 * @param {Number} second Второе число
 * @param {Number} limit Предел
 * @returns {Number} Максимум двух чисел, если максимум больше предела - возвращает его
 */
function getLimitedMax(first, second, limit) {
    return Math.min(Math.max(first, second), limit);
}

/**
 * Создает объект конфигурации с данными о длинах колонок. 
 * Ширина колонок подбирается по самому длинному значению в колонке, но не больше максимальной.
 * @param {Comment[]} data Массив комментариев
 * @returns {Config} Объект конфигурации
 */
function getLengthConfig (data) {
    const config = {
        userLength: 4,
        dateLength: 4,
        commentLength: 7,
        fileNameLength: 8,
        fullLength: 0
    };
    for (let comment of data) {
        config.userLength = getLimitedMax(config.userLength, comment.user.length, 10);
        config.dateLength = getLimitedMax(config.dateLength, comment.date.length, 10);
        config.commentLength = getLimitedMax(config.commentLength, comment.text.length, 50);
        config.fileNameLength = getLimitedMax(config.fileNameLength, comment.file.length, 15);
    }
    config.fullLength = 25 + config.userLength + config.dateLength + config.commentLength + config.fileNameLength;

    return config;
}

/**
 * Дополняет текст для колонки пробелами, если его длина меньше размера колонки, в противном случае 
 * обрезает текст
 * @param {String} text Текст для колонки
 * @param {Number} maxLen Размер колонки
 * @returns {String} Обработанный текст
 */
function handleCellText(text, maxLen) {
    return text.length <= maxLen ? text + ' '.repeat(maxLen - text.length) : text.substr(0, maxLen - 3) + '...';
}

/**
 * Формирует отдельную строку таблицы с данными о комментарии
 * @param {Comment} comment Объект комментария
 * @param {Config} config Объект конфигурации
 * @returns {String} Строка таблицы
 */
function formTableRow (comment, config) {
    const isImportant = comment.importance > 0 ? '!' : ' ';
    const username = handleCellText(comment.user, config.userLength);
    const date = handleCellText(comment.date, config.dateLength);
    const text = handleCellText(comment.text, config.commentLength);
    const fileName = handleCellText(comment.file, config.fileNameLength);

    return `  ${isImportant}  |  ${username}  |  ${date}  |  ${text}  |  ${fileName}  \n`;
}

/**
 * Выводит в консоль таблицу с данными о каждом комментарии в переданном массиве
 * @param {Comment[]} data Массив комментариев
 */
function printTable(data) {
    const config = getLengthConfig(data);
    let table = `  !  |  ${handleCellText('user', config.userLength)}  ` + 
        `|  ${handleCellText('date', config.dateLength)}  ` + 
        `|  ${handleCellText('comment', config.commentLength)}  ` +
        `|  ${handleCellText('fileName', config.fileNameLength)}  \n`;
    table += '-'.repeat(config.fullLength) + '\n';

    for (let comment of data) {
        table += formTableRow(comment, config);
    }
    if (data.length > 0) {
        table += '-'.repeat(config.fullLength) + '\n';
    }

    console.log(table);
}

module.exports = {
    printTable
};
