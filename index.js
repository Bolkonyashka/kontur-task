const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');
const { printTable } = require('./tablePrinter');

app();

function app () {
    console.log('Please, write your command!');
    readLine(processCommand);
}

/*
    Возвращает массив, в котором каждому .js файлу текущей директории соответствует 
    объект с полями path (путь к файлу) и data (текст файла)
*/
function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');

    return filePaths.map((path) => { return { path: path, data: readFile(path) } });
}

/*
    Ищет todo-комментарии в тексте данного файла, структурирует их с помощью structComment(),
    наполняет аккумулирующий массив для reduce()
*/
function findComments (acc, fileObj) {
    const pattern = /\/\/\s*TODO\s*[\s:]{1}\s*.*/ig;
    const match = fileObj.data.match(pattern);
    console.log(match);
    if (match) {
        acc = acc.concat(match.map(comment => structComment(comment, fileObj.path)));
    } // TODO не переиспользовать data, а ввести еще одно свойство - comments?

    return acc;
}

/*
    Возвращает количество восклицательных знаков в переданном тексте
*/
function getImportanceValue (text) {
    const result = text.match(/!/g);

    return result? result.length : 0;
}

/*
    Проверяет валидность даты для форматов yyyy-mm-dd и dd-mm-yyyy,
    пробелы в переданной строке игнорируются
*/
function checkDate (dateString) { // TODO :roma; 15 - 02 - 2019; стоит ли оставлять ограничение до 3 тысячелетия? :)
    const pattern = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$|^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[1-9]\d{3}$/;

    return pattern.test(dateString.replace(/\s+/g, ''));
}

/*
    Удаляет пробелы из строки с датой,
    если дата в формате dd-mm-yyyy, перводит в формат yyyy-mm-dd
*/
function normalizeDate (dateString) {
    let result = dateString.replace(/\s+/g, '');
    const pattern = /(\d\d)-(\d\d)-(\d{4})/;
    const match = result.match(pattern);
    if (match) {
        result = match[3] + '-' + match[2] + '-' + match[1];
    }

    return result;
}

/*
    Возвращает объект с данными о комментарии
*/
function structComment (comment, path) {
    const fileName = path.replace(/^.*[\\\/]/, '');
    const pattern = /\/\/\s*TODO\s*[\s:]{1}\s*((.*);(.*);){0,1}(.*)/i;
    const match = comment.match(pattern);

    return {
        importance: getImportanceValue(match[4]),
        user: match[2] ? match[2].trim() : '',
        date: match[3] && checkDate(match[3]) ? normalizeDate(match[3]) : '',
        text: match[4].trim(),
        file: fileName 
    };
}

/*
    Возвращет массив, состоящий из всех todo коментариев в .js файлах 
    текущей директори, структурированных в объекты
*/
function getComments () {
    return getFiles().reduce(findComments, []);
}

/*
    Выводит таблицу со всеми комментариями
*/
function printAll () {
    printTable(getComments());
}

/*
    Выводит таблицу с комментариями, в которых есть восклицательный знак
*/
function printImportant () {
    printTable(getComments().filter(comm => comm.importance > 0));
}

/*
    Выводит таблицу с комментариями, созданными пользователем, никнейм 
    которого начинается на указанный пользователем префикс или совпадает с ним
*/
function printByUser(username) { // tODo : romochka;;обрабатывать пустой и неопределенный юзернейм
    if (username) {
        printTable(getComments().filter(comm => comm.user.toLowerCase().indexOf(username.toLowerCase()) === 0));
    } else {
        console.log('Enter command argument: username');
    }
    
}

function usernameSort (a, b) {
   if (!a.user && b.user) {
       return 1;
   }
   if (!b.user && a.user) {
       return -1;
   }

   return a.user.localeCompare(b.user);
}

function printSorted(sortType) {
    const commandTip = 'Enter command argument: importance | user | date';
    if (sortType) {
        switch (sortType.toLowerCase()) {
            case 'importance':
                printTable(getComments().sort((a, b) => b.importance - a.importance));
                break;
            case 'user':
                printTable(getComments().sort(usernameSort));
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

function printByDate (date) {
    const commandTip = 'Enter command argument: date in one of the formats: yyyy | yyyy-mm | yyyy-mm-dd';
    if (date) {
        const pattern = /^(\d{4})(\s*-\s*(\d\d)){0,1}(\s*-\s*(\d\d)){0,1}$/;
        const match = date.match(pattern);
        if (match) {
            const fullDate = match[1] + '-' + (match[3] || '01') + '-' + (match[5] || '01');
            if (checkDate(fullDate)) {
                printTable(getComments().filter(comm => comm.date.localeCompare(fullDate) >= 0)
                    .sort((a, b) => a.date.localeCompare(b.date)));
            } else {
                console.log('Incorrect date');
            }
        } else {
            console.log(commandTip);
        }
    } else {
        console.log(commandTip);
    }
}

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

// TODO you can do it!
//               TODO           saskeUzum@k1-kokok sasai   ;   2019-01-01  ;   CHTOTOTTUTNETAK
//TODO                                                      
//todo roma@4232@@44954""""";04-10-1996;  benedick cumberskotch!!!!!!!!!!
//TODO roma;17 - 02-2019;
//todo:;;