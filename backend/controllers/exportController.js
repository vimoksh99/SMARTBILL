const Bill = require('../models/Bill');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// @desc    Export bills as CSV
// @route   GET /api/export/csv
// @access  Private
exports.exportCSV = async (req, res, next) => {
    try {
        const bills = await Bill.find({ userId: req.user.id }).lean();
        
        const fields = ['billName', 'amount', 'dueDate', 'category', 'status', 'providerName'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(bills);
        
        res.header('Content-Type', 'text/csv');
        res.attachment(`bills_export_${Date.now()}.csv`);
        return res.send(csv);
    } catch (err) {
        next(err);
    }
};

// @desc    Export bills as PDF
// @route   GET /api/export/pdf
// @access  Private
exports.exportPDF = async (req, res, next) => {
    try {
        const bills = await Bill.find({ userId: req.user.id });
        
        const doc = new PDFDocument();
        let filename = `bills_export_${Date.now()}.pdf`;
        
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');
        
        doc.pipe(res);
        
        doc.fontSize(25).text('Bill Payment Reminder Report', 100, 100);
        doc.moveDown();
        
        bills.forEach(b => {
            doc.fontSize(12).text(`${b.billName} - ₹${b.amount} - Due: ${b.dueDate.toISOString().split('T')[0]} - Status: ${b.status}`);
        });
        
        doc.end();
    } catch (err) {
        next(err);
    }
};
