const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const { printTable } = require('./tablePrinter');

app();

function app () {
    console.log('Please, write your command!');
    readLine(processCommand);
}

/**
 * Возвращает массив объектов с данными о каждом .js файле текущей директории
 * @returns {Array<{path: String, data: String}>} Результирующий массив
 */
function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');

    return filePaths.map((path) => { return { path: path, data: readFile(path) } });
}

/**
 * Находит все todo комментарии в тексте файла, структурирует, наполняет аккумулирующий массив
 * @param {Array} acc Аккумулирующий массив
 * @param {{path: String, data: String}} fileObj Объект с данными файла
 * @returns {Array<{importance: Number, user: String, date: String, text: String, file: String}>} Аккумулирующий массив
 */
function findComments (acc, fileObj) {
    const pattern = /\/\/ *TODO *[ :]{1} *.*$/igm;
    const match = fileObj.data.match(pattern);
    if (match) {
        acc = acc.concat(match.map(comment => structComment(comment, fileObj.path)));
    }

    return acc;
}

/**
 * Возвращает количество восклицательных знаков в переданном тексте
 * @param {String} text Текст для поиска
 * @returns {Number} Количество восклицательных знаков
 */
function getExclamationCount (text) {
    const result = text.match(/!/g);

    return result? result.length : 0;
}

function handleDateString(dateString) {
    let result = '';
    /*dateString = dateString.replace(/ +/g, '');
    const pattern = /^\d{4}(-\d\d(-\d\d){0,1}){0,1}|((\d\d-){0,1}\d\d-){0,1}\d{4}$/;
    if (pattern.test(dateString)) {
        dateString = normalizeDate(dateString);
        if (checkDate(dateString)) {
            result = dateString;
        }
    }*/
    dateString = normalizeDate(dateString.replace(/ +/g, ''));
    if (checkDate(dateString)) {
        result = dateString;
    }

    return result;
}

function extendDate (dateString) {
    const pattern = /^(\d{4})(-(\d\d)){0,1}(-(\d\d)){0,1}$/;
    const match = date.match(pattern);
    const fullDate = match[1] + '-' + (match[3] || '01') + '-' + (match[5] || '01');
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
    let result = dateString;
    const pattern = /((\d\d)-){0,1}(\d\d)-(\d{4})/;
    const match = result.match(pattern);
    if (match) {
        result = match[4] + '-' + match[3] + (match[1] ? '-' + match[2] : '');
    }

    return result;
}

/**
 * Структурирует строку комментария в объект
 * @param {String} comment Строка комментария
 * @param {String} path Путь к файлу
 * @returns {{importance: Number, user: String, date: String, text: String, file: String}} Объект c информацией о комментарии
 */
function structComment (comment, path) {
    const fileName = path.replace(/^.*[\\\/]/, '');
    const pattern = /\/\/ *TODO *[ :]{1} *(([^;]*);([^;]*);){0,1}(.*)/i;
    const match = comment.match(pattern);

    return {
        importance: getExclamationCount(match[4]),
        user: match[2] ? match[2].trim() : '',
        date: match[3] ? handleDateString(match[3]) : '',
        text: match[4].trim(),
        file: fileName 
    };
}

/**
 * Возвращет массив, состоящий из всех todo коментариев в .js файлах
 * текущей директории, структурированных в объекты, за исключением
 * комментариев без текста, даты и имени пользователя
 * @returns {Array<{importance: Number, user: String, date: String, text: String, file: String}>} Массив комментариев, структурированных в объекты
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
 * Выводит таблицу с комментариями, в которых есть восклицательный знак
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
    if (!a && b) {
        return 1;
    }
    if (!b && a) {
        return -1;
    }

    return a.localeCompare(b);
}

/**
 * Выводит таблицу отсортированных по заданному критерию комментариев
 * @param {String} sortType Критерий сортировки
 */
function printSorted(sortType) {
    const commandTip = 'Enter sort type: importance | user | date';
    if (sortType) {
        switch (sortType.toLowerCase()) {
            case 'importance':
                printTable(getComments().sort((a, b) => b.importance - a.importance));
                break;
            case 'user':
                printTable(getComments().sort((a, b) => compareStrings(a.user, b.user)));
                break;
            case 'date':
                printTable(getComments().sort((a, b) => -a.date.localeCompare(b.date)));
                break;
            default:
                console.log(commandTip);
                break;
    }
    } else {
        console.log(commandTip);
    }
}

/**
 * Выводит таблицу с комментариями, созданными после указанной даты, включая её
 * @param {String} date Строковое представление даты
 */
function printByDate (date) {
    const commandTip = 'Enter date in one of the formats: yyyy | yyyy-mm | yyyy-mm-dd';
    const pattern = /^(\d{4})( *- *(\d\d)){0,1}( *- *(\d\d)){0,1}$/;
    if (date && pattern.test(date)) {
        const match = date.match(pattern);
        const fullDate = match[1] + '-' + (match[3] || '01') + '-' + (match[5] || '01');
        if (checkDate(fullDate)) {
            printTable(getComments()
                .filter(comm => comm.date.localeCompare(fullDate) >= 0)
                .sort((a, b) => a.date.localeCompare(b.date)));
        } else {
            console.log('Incorrect date');
        }
    } else {
        console.log(commandTip);
    }
}

/**
 * Анализирует и выполняет введенную пользователем команду
 * @param {String} command Комманда для выполнения
 */
function processCommand (command) {
    const splitted = command.split(/\s+/);
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

//toDo          :  adas@***54353\\//todo; 2018    ; sha slomaem
//todo aa; 0123; fff
//todo aa; 2015 - 12 - 01ffdf; fff
//todo aa; 45-12-2015; fff
//todo aa; 2015fffffff; fff
//todo aa; sd2015; fff
//todo aa; 12-201d5; fff