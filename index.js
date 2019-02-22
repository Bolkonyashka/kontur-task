const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const { printTable } = require('./tablePrinter');

app();

function app () {
    console.log('Please, write your command!');
    readLine(processCommand);
}

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
 * @typedef {Object} FileObject Объект для представления файла
 * @property {String} path - путь к файлу
 * @property {String} data - содержимое файла
 */

/**
 * Возвращает массив объектов с данными о каждом .js файле текущей директории
 * @returns {FileObject[]} Результирующий массив
 */
function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');

    return filePaths.map((path) => { return { path: path, data: readFile(path) } });
}

/**
 * Возвращает количество восклицательных знаков в переданном тексте
 * @param {String} text Текст для поиска
 * @returns {Number} Количество восклицательных знаков
 */
function getExclamationCount (text) {
    const result = text.match(/!/g);

    return result ? result.length : 0;
}

/**
 * Дополняет неполные даты до yyyy-mm-01 или yyyy-01-01, возвращает пустую строку,
 * если это невозможно
 * @param {String} dateString Дата в формате yyyy[-mm[-dd]]
 * @returns {String} Дата в формате yyyy-mm-dd или пустая строка
 */
function extendDate (dateString) {
    const pattern = /^(\d{4})(-(\d\d)){0,1}(-(\d\d)){0,1}$/;
    const match = dateString.match(pattern);
    return match ? `${match[1]}-${match[3] || '01'}-${match[5] || '01'}` : ''
}

/**
 * Проверяет валидность даты
 * @param {String} dateString Дата в формате yyyy-mm-dd
 * @returns {Boolean} Результат проверки
 */
function checkDate (dateString) {
    const pattern = /^[1-9]\d{3}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01])){0,1}){0,1}$/;

    return pattern.test(dateString.replace(/ +/g, ''));
}

/**
 * Если дата в формате dd-mm-yyyy или mm-yyyy, перводит в формат yyyy-mm-dd или yyyy-mm
 * @param {String} dateString Дата
 * @returns {String} Строковое представление даты в каноничном формате
 */
function normalizeDate (dateString) {
    let result = dateString.replace(/ +/g, '');
    const pattern = /^((\d\d)-){0,1}(\d\d)-(\d{4})$/;
    const match = result.match(pattern);
    if (match) {
        result = match[4] + '-' + match[3] + (match[1] ? '-' + match[2] : '');
    }

    return result;
}

/**
 * Переводит дату в формат yyyy[-mm[-dd]], если это возможно,
 * проверяет дату на валидность
 * @param {String} dateString Строка для форматирования
 * @returns {String} Дата в формате yyyy[-mm[-dd]] или пустая строка, если дата некорректна
 */
function handleDateString(dateString) {
    dateString = normalizeDate(dateString);

    return checkDate(dateString) ? dateString : '';
}

/**
 * Структурирует строку комментария в объект
 * @param {String} comment Строка комментария
 * @param {String} path Путь к файлу
 * @param {Number} counter Номер комментария в порядке просмотра
 * @returns {Comment} Объект c информацией о комментарии
 */
function structComment (comment, path, counter) {
    const fileName = path.replace(/^.*[\\\/]/, '');
    const pattern = /\/\/ *TODO *[ :]{1} *(([^;]*);([^;]*);){0,1}(.*)/i;
    const match = comment.match(pattern);

    return {
        id: counter,
        importance: getExclamationCount(match[4] || ''),
        user: match[2] ? match[2].trim() : '',
        date: match[3] ? handleDateString(match[3]) : '',
        text: match[4].trim(),
        file: fileName 
    };
}

/**
 * Находит все todo комментарии в тексте файла, структурирует их, наполняет аккумулирующий массив
 * @param {Comment[]} acc Аккумулирующий массив
 * @param {FileObject} fileObj Объект с данными файла
 * @returns {Comment[]} Аккумулирующий массив
 */
function findComments(acc, fileObj) {
    let counter = acc.length;
    const pattern = /\/\/ *TODO *[ :]{1} *.*$/igm;
    const match = fileObj.data.match(pattern);
    if (match) {
        acc = acc.concat(match.map(comment => structComment(comment, fileObj.path, counter++)));
    }

    return acc;
}

/**
 * Возвращет массив, состоящий из всех todo коментариев в .js файлах
 * текущей директории, структурированных в объекты, за исключением
 * комментариев без текста, даты и имени пользователя
 * @returns {Comment[]} Массив комментариев, структурированных в объекты
 */
function getComments () {
    return getFiles().reduce(findComments, []).filter(comm => comm.date || comm.user || comm.text);
}

/**
 * Выводит таблицу со всеми комментариями
 */
function printAll () {
    printTable(getComments());
}

/**
 * Выводит таблицу с комментариями, в которых есть хоть один восклицательный знак
 */
function printImportant () {
    printTable(getComments().filter(comm => comm.importance > 0));
}

/**
 * Выводит таблицу с комментариями, созданными пользователем, никнейм
 * которого начинается на указанный префикс или совпадает с ним
 * @param {String} username Префикс или полный никнейм для поиска
 */
function printByUser(username) {
    if (username) {
        printTable(getComments().filter(comm => comm.user.toLowerCase().indexOf(username.toLowerCase()) === 0));
    } else {
        console.log('Enter username');
    }
}

/**
 * Сравнивает две строки.
 * Пустая строка всегда считается больше непустой
 * @param {String} a Первая строка
 * @param {String} b Вторая строка
 * @returns {Number} Отрицательное число, если первая строка меньше второй,
 * положительное, если больше, ноль, если строки эквивалентны.
 */
function compareStrings (a, b) {
    return !a && b ? 1 : a && !b ? -1 : a.localeCompare(b);
}

/**
 * Выводит таблицу отсортированных по заданному критерию комментариев
 * @param {String} sortType Критерий сортировки
 */
function printSorted(sortType) {
    const commandTip = 'Enter sort type: importance | user | date';
    switch ((sortType || '').toLowerCase()) {
        case 'importance':
            printTable(getComments().sort((a, b) => b.importance - a.importance || a.id - b.id));
            break;
        case 'user':
            printTable(getComments().sort((a, b) => compareStrings(a.user.toLowerCase(), b.user.toLowerCase()) || a.id - b.id));
            break;
        case 'date':
            printTable(getComments().sort((a, b) => -extendDate(a.date).localeCompare(extendDate(b.date)) || a.id - b.id));
            break;
        default:
            console.log(commandTip);
            break;
    }
}

/**
 * Выводит таблицу с комментариями, созданными после указанной даты, включая её
 * @param {String} date Строковое представление даты
 */
function printByDate (date) {
    const commandTip = 'Enter the correct date in one of the formats: yyyy | yyyy-mm | yyyy-mm-dd | mm-yyyy | dd-mm-yyyy';
    const fullDate = extendDate(handleDateString(date || ''));
    if(fullDate) 
    {
        printTable(getComments()
            .filter(comm => extendDate(comm.date).localeCompare(fullDate) >= 0)
            .sort((a, b) => extendDate(a.date).localeCompare(extendDate(b.date)) || a.id - b.id));    
    } else {
        console.log(commandTip);
    }
}

/**
 * Анализирует и выполняет введенную пользователем команду
 * @param {String} command Комманда для выполнения
 */
function processCommand (command) {
    const splitted = command.split(/ +/);
    const [commandType, commandArg] = [splitted[0], splitted.slice(1).join(' ')];
    switch (commandType.toLowerCase()) {
        case "show":
            printAll();
            break;
        case "important":
            printImportant();
            break;
        case "user":
            printByUser(commandArg);
            break;
        case "sort":
            printSorted(commandArg);
            break;
        case "date":
            printByDate(commandArg);
            break;
        case "exit":
            process.exit(0);
            break;
        default:
            console.log("wrong command");
            break;
    }
}
