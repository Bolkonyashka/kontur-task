const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

app();

function app () {
    // const files = getFiles();

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

function structComments (acc, fileObj) {
    const fileName = fileObj.path.replace(/^.*[\\\/]/, '');
    const pattern = /((.*){0,1};\s*(\d{4}-\d\d-\d\d|\d\d-\d\d-\d{4}){0,1}\s*;){0,1}(.*)/i;

    for (let comment of fileObj.data) { 
        let match = comment.match(pattern);
        acc.push({ important: match[4].search('!') !== -1, 
            user: match[2] && match[2].trim() || ' ',
            date: match[3] && match[3].trim() || ' ',
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

function processCommand (command) {
    const [commandType, commandArg] = command.split(' ');
    
    switch (commandType.toLowerCase()) {
        case "show":
            printAll();
            break;
        case "important":
            console.log("important");
            break;
        case "user":
            console.log("user");
            break;
        case "sort":
            console.log("sort");
            break;
        case "date":
            console.log("date");
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