const fs = require('fs');
const path = require('path');

const ITEMS_PER_PAGE = 5; // Number of files to display per page

// Middleware to handle pagination
function pagination(req, res, next) {
    const directoryPath = path.join(__dirname, '../uploads');
    const allFiles = fs.readdirSync(directoryPath);

    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = page * ITEMS_PER_PAGE;

    req.paginatedFiles = allFiles.slice(startIndex, endIndex);
    req.currentPage = page;
    req.totalPages = Math.ceil(allFiles.length / ITEMS_PER_PAGE);

    next();
}

module.exports = pagination;