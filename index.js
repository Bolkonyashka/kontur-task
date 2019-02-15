const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

app();

function app () {
    console.log('Please, write your command!');
    readLine(processCommand);
}

function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');

    return filePaths.map((path) => { return { path: path, data: readFile(path) } });
}

function findComments (fileObj) {
    const pattern = /\/\/\s*TODO\s*[\s:]{1}\s*.*/ig;
    let result = fileObj.data.match(pattern);
    if (result) {
        result = result.map(comment => comment.replace(/\/\/\s*TODO\s*[\s:]{1}\s*/ig, ''));
    }
    fileObj.data = result; // TODO не переиспользовать data, а ввести еще одно свойство - comments?

    return fileObj;
}

function getImportanceValue (text) {
    const result = text.match(/!/g);
    if (!result) {
        return 0;
    }

    return result.length;
}

function checkDate (dateString) { // TODO :roma; 15 - 02 - 2019; стоит ли оставлять ограничение до 3 тысячелетия? :)
    const pattern = /^[1-3]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$|^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-[1-3]\d{3}$/;
    return pattern.test(dateString.replace(/\s+/g, ''));
}

function normalizeDate (dateString) {
    let result = dateString.replace(/\s+/g, '');
    const pattern = /(\d\d)-(\d\d)-(\d{4})/;
    const match = result.match(pattern);
    if (match) {
        result = match[3] + '-' + match[2] + '-' + match[1];
    }

    return result;
}

function structComments (acc, fileObj) {
    const fileName = fileObj.path.replace(/^.*[\\\/]/, '');
    const pattern = /((.*);(.*);){0,1}(.*)/i; // /((.*){0,1};\s*(\d{4}\s*-\s*\d\d\s*-\s*\d\d){0,1}\s*;){0,1}(.*)/i

    for (let comment of fileObj.data) { 
        const match = comment.match(pattern);
        acc.push({
            importance: getImportanceValue(match[4]),
            user: match[2] && match[2].trim() || '',
            date: match[3] && checkDate(match[3]) ? normalizeDate(match[3]) : '',
            text: match[4].trim(),
            file: fileName });
    }
    return acc;
}

function getComments () {
    const filesData = getFiles();

    return filesData.map(findComments).reduce(structComments, []);
}

function printAll () {
    console.log(getComments());
}

function printImportant () {
    console.log(getComments().filter(comm => comm.importance > 0));
}

function printByUser(username) { // tODo : romochka;обрабатывать пустой и неопределенный юзернейм
    if (username) {
        console.log(getComments().filter(comm => comm.user.toLowerCase().indexOf(username.toLowerCase()) === 0));
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
                console.log(getComments().sort((a, b) => b.importance - a.importance));
                break;
            case 'user':
                console.log(getComments().sort(usernameSort));
                break;
            case 'date':
                console.log(getComments().sort((a, b) => -a.date.localeCompare(b.date)));
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
        const pattern = /^(\d{4})(-(\d\d)){0,1}(-(\d\d)){0,1}$/;
        const match = date.match(pattern);
        console.log(match);
    } else {
        console.log(commandTip);
    }
}

function processCommand (command) {
    const [commandType, commandArg] = command.split(' '); // TODO делить по вервому пробелу и только!!!!!!!
    
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
//todo roma@4232@@44954""""";04-10-1996;  benedick cumberskotch