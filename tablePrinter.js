const config = {};

function initializeConfig() {
    config.userLength = 4;
    config.dateLength = 4;
    config.commentLength = 7;
    config.fileNameLength = 8;
    config.fullLength = 0;
}

function findLengthValues (data) {
    for (let comment of data) {
        config.userLength = Math.min(Math.max(config.userLength, comment.user.length), 10);
        config.dateLength = Math.min(Math.max(config.dateLength, comment.date.length), 10);
        config.commentLength = Math.min(Math.max(config.commentLength, comment.text.length), 50);
        config.fileNameLength = Math.min(Math.max(config.fileNameLength, comment.file.length), 15);
    }
    config.fullLength = 25 + config.userLength + config.dateLength + config.commentLength + config.fileNameLength;
}

function handleCellText(text, maxLen) {
    return text.length <= maxLen ? text + ' '.repeat(maxLen - text.length) : text.substr(0, maxLen - 3) + '...';
}

function formTableRow (comment) {
    const isImportant = comment.importance > 0 ? '!' : ' ';
    const username = handleCellText(comment.user, config.userLength);
    const date = handleCellText(comment.date, config.dateLength);
    const text = handleCellText(comment.text, config.commentLength);
    const fileName = handleCellText(comment.file, config.fileNameLength);

    return `  ${isImportant}  |  ${username}  |  ${date}  |  ${text}  |  ${fileName}  \n`;
}

function printTable (data) {
    initializeConfig();
    findLengthValues(data);
    let table = `  !  |  ${handleCellText('user', config.userLength)}  |  ${handleCellText('date', config.dateLength)}  |  ${handleCellText('comment', config.commentLength)}  |  ${handleCellText('fileName', config.fileNameLength)}  \n`;
    
    table += '-'.repeat(config.fullLength) + '\n';

    for (let comment of data) {
        table += formTableRow(comment);
    }
    if (data.length > 0) {
        table += '-'.repeat(config.fullLength) + '\n';
    }

    console.log(table);
}

module.exports = {
    printTable
};
