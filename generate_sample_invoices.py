import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_invoice(filename, inv_number, po_number, vendor_name, vendor_gstin, vendor_address, items, subtotal, tax_amount, total_amount, is_igst=False):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=16, leading=20, textColor=colors.HexColor('#0E1117'), fontName='Helvetica-Bold')
    normal_style = ParagraphStyle('Norm', parent=styles['Normal'], fontSize=9, leading=12, textColor=colors.HexColor('#334155'), fontName='Helvetica')
    bold_style = ParagraphStyle('Bold', parent=styles['Normal'], fontSize=9, leading=12, textColor=colors.HexColor('#0E1117'), fontName='Helvetica-Bold')
    header_right = ParagraphStyle('HRight', parent=styles['Normal'], fontSize=9, leading=13, alignment=2, textColor=colors.HexColor('#334155'), fontName='Helvetica')
    inv_title_style = ParagraphStyle('InvTitle', parent=styles['Normal'], fontSize=12, leading=15, alignment=2, textColor=colors.HexColor('#0D9488'), fontName='Helvetica-Bold')

    # Top Header: Vendor info left, Invoice info right
    header_data = [
        [
            Paragraph(f"<b>{vendor_name}</b><br/>{vendor_address}<br/><b>GSTIN:</b> {vendor_gstin}<br/><b>Email:</b> billing@{vendor_name.split()[0].lower()}.in", normal_style),
            Paragraph(f"TAX INVOICE<br/><font color='#0D9488' size='11'><b>Invoice No: {inv_number}</b></font><br/><b>Invoice Date:</b> 15-Nov-2026<br/><b>Due Date:</b> 15-Dec-2026<br/><b>PO Number:</b> {po_number}", header_right)
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # Billed to Customer Box
    customer_data = [
        [
            Paragraph("<b>BILLED TO (BUYER):</b><br/><b>Templegate Enterprise Solutions Ltd.</b><br/>Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Rd<br/>Bengaluru, Karnataka 560103<br/><b>Customer GSTIN:</b> 29AAACT9876Q1Z2 (Karnataka - 29)", normal_style),
            Paragraph(f"<b>PAYMENT INSTRUCTIONS:</b><br/><b>Terms:</b> Net 30 Days<br/><b>Currency:</b> INR (₹)<br/><b>Disbursement Mode:</b> Direct Bank Transfer (NEFT/RTGS)<br/><b>Purchase Order Ref:</b> {po_number}", normal_style)
        ]
    ]
    cust_table = Table(customer_data, colWidths=[300, 240])
    cust_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(cust_table)
    story.append(Spacer(1, 14))

    # Line Items Table
    table_rows = [
        [
            Paragraph("<b>#</b>", bold_style),
            Paragraph("<b>Item Description</b>", bold_style),
            Paragraph("<b>HSN Code</b>", bold_style),
            Paragraph("<b>Qty</b>", bold_style),
            Paragraph("<b>Unit Price (₹)</b>", bold_style),
            Paragraph("<b>Tax Rate</b>", bold_style),
            Paragraph("<b>Total (₹)</b>", bold_style)
        ]
    ]

    for idx, itm in enumerate(items, 1):
        table_rows.append([
            Paragraph(str(idx), normal_style),
            Paragraph(itm['desc'], normal_style),
            Paragraph(itm.get('hsn', '998315'), normal_style),
            Paragraph(f"{itm['qty']:.1f}", normal_style),
            Paragraph(f"₹{itm['rate']:,.2f}", normal_style),
            Paragraph(f"{itm.get('tax_rate', 18):.0f}%", normal_style),
            Paragraph(f"₹{itm['total']:,.2f}", normal_style)
        ])

    items_table = Table(table_rows, colWidths=[25, 215, 60, 45, 75, 50, 70])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#94A3B8')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('ALIGN', (3,1), (-1,-1), 'RIGHT'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10))

    # Summary Totals Table
    tax_label = "IGST (18%)" if is_igst else "CGST (9%) + SGST (9%)"
    summary_data = [
        ["Taxable Subtotal:", f"INR {subtotal:,.2f}"],
        [f"GST Tax ({tax_label}):", f"INR {tax_amount:,.2f}"],
        ["Grand Total Payable:", f"INR {total_amount:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[380, 160])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 10),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor('#0F766E')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#0D9488')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 25))

    # Footer Notes & Authorized Signatory
    footer_data = [
        [
            Paragraph("<b>Terms & Conditions:</b><br/>1. Goods once sold are covered under standard manufacturer warranty.<br/>2. Payment is due within 30 days via NEFT/RTGS direct transfer.<br/>3. Computer generated invoice — no physical signature required.", normal_style),
            Paragraph(f"<b>For {vendor_name}</b><br/><br/><br/><b>Authorised Signatory</b>", header_right)
        ]
    ]
    footer_table = Table(footer_data, colWidths=[340, 200])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(footer_table)

    doc.build(story)
    print(f"Created {filename}")

if __name__ == '__main__':
    out_dir = "sample_invoices"

    # Invoice 1: Zenith Hardware (3-Way Match to PO-2026-102 & GRN-2026-001)
    create_invoice(
        filename=os.path.join(out_dir, "01_Zenith_Hardware_3Way_Match.pdf"),
        inv_number="INV-2026-9042",
        po_number="PO-2026-102",
        vendor_name="Zenith Hardware & Networking Solutions",
        vendor_gstin="27AAACZ4321K1Z2",
        vendor_address="MIDC Andheri East, Mumbai, Maharashtra 400093",
        items=[
            {"desc": "Dell Latitude 5540 Core i7 Workstations", "hsn": "847130", "qty": 5.0, "rate": 85000.0, "tax_rate": 18.0, "total": 501500.0},
            {"desc": "Logitech MX Master 3S Wireless Mice", "hsn": "847160", "qty": 5.0, "rate": 8500.0, "tax_rate": 18.0, "total": 50150.0}
        ],
        subtotal=467500.0,
        tax_amount=84150.0,
        total_amount=551650.0,
        is_igst=True
    )

    # Invoice 2: Apex Cloud (2-Way Match to PO-2026-101)
    create_invoice(
        filename=os.path.join(out_dir, "02_Apex_Cloud_2Way_Match.pdf"),
        inv_number="INV-2026-7731",
        po_number="PO-2026-101",
        vendor_name="Apex Cloud Technologies Pvt Ltd",
        vendor_gstin="29AABCA1234F1Z5",
        vendor_address="Koramangala 4th Block, Bengaluru, Karnataka 560034",
        items=[
            {"desc": "Enterprise Cloud Server Hosting - Q1", "hsn": "998315", "qty": 1.0, "rate": 45000.0, "tax_rate": 18.0, "total": 53100.0},
            {"desc": "Database Backup & Disaster Recovery Storage", "hsn": "998316", "qty": 1.0, "rate": 15000.0, "tax_rate": 18.0, "total": 17700.0}
        ],
        subtotal=60000.0,
        tax_amount=10800.0,
        total_amount=70800.0,
        is_igst=False
    )

    # Invoice 3: Variance Exception (Global Office Supplies with rate discrepancy)
    create_invoice(
        filename=os.path.join(out_dir, "03_Global_Supplies_Price_Variance.pdf"),
        inv_number="INV-2026-5590",
        po_number="PO-2026-103",
        vendor_name="Global Office Supplies Corp",
        vendor_gstin="29AABCG8888P1Z9",
        vendor_address="45 Peenya Industrial Area, Bengaluru, Karnataka 560058",
        items=[
            {"desc": "A4 Multipurpose Copier Paper Boxes (5 Reams)", "hsn": "480256", "qty": 50.0, "rate": 1450.0, "tax_rate": 12.0, "total": 81200.0},
            {"desc": "High Yield Toner Cartridge TN-B021", "hsn": "844399", "qty": 8.0, "rate": 3500.0, "tax_rate": 18.0, "total": 33040.0}
        ],
        subtotal=100500.0,
        tax_amount=13740.0,
        total_amount=114240.0,
        is_igst=False
    )
