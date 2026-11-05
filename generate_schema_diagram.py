import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set up canvas for a wide, high-resolution layout
fig, ax = plt.subplots(figsize=(22, 14), dpi=300)
fig.patch.set_facecolor('#0E1117')
ax.set_facecolor('#0E1117')
ax.set_xlim(0, 220)
ax.set_ylim(0, 140)
ax.axis('off')

# Title & Header
ax.text(110, 134, "ACCOUNTS PAYABLE AUTOMATION — RELATIONAL DATABASE SCHEMA", 
        fontsize=15, fontweight='bold', color='#E5E9F0', ha='center', fontfamily='monospace')
ax.text(110, 130, "PostgreSQL Production Schema • 3-Way Matching • Multi-Tier Approvals • Bank Settlement • ERP Sync", 
        fontsize=9, color='#7E8799', ha='center', fontfamily='monospace')

# Define tables and their positions: (x, y, width, height)
# Structure: title, header_bg, fields: list of (pk/fk, name, type)
tables = {
    'vendors': {
        'pos': (10, 82, 36, 42),
        'title': 'vendors',
        'color': '#0D9488',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('UQ', 'name', 'VARCHAR(150)'),
            ('UQ', 'code', 'VARCHAR(50)'),
            ('IDX', 'tax_id', 'VARCHAR(50)'),
            ('', 'state', 'VARCHAR(50)'),
            ('', 'state_code', 'VARCHAR(10)'),
            ('', 'category', 'VARCHAR(50)'),
            ('', 'payment_terms', 'VARCHAR(30)'),
            ('', 'status', 'VARCHAR(30)'),
            ('', 'rating', 'NUMERIC(3,2)'),
            ('', 'created_at', 'TIMESTAMP')
        ]
    },
    'vendor_bank_accounts': {
        'pos': (10, 42, 36, 32),
        'title': 'vendor_bank_accounts',
        'color': '#0D9488',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'vendor_id', 'INTEGER'),
            ('', 'bank_name', 'VARCHAR(100)'),
            ('', 'account_number', 'VARCHAR(50)'),
            ('', 'ifsc_code', 'VARCHAR(20)'),
            ('', 'account_type', 'VARCHAR(20)'),
            ('', 'is_primary', 'BOOLEAN'),
            ('', 'is_verified', 'BOOLEAN')
        ]
    },
    'purchase_orders': {
        'pos': (56, 88, 36, 36),
        'title': 'purchase_orders',
        'color': '#2563EB',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('UQ', 'po_number', 'VARCHAR(50)'),
            ('FK', 'vendor_id', 'INTEGER'),
            ('', 'issue_date', 'TIMESTAMP'),
            ('', 'status', 'VARCHAR(30)'),
            ('', 'department', 'VARCHAR(50)'),
            ('', 'subtotal', 'NUMERIC(15,2)'),
            ('', 'tax_amount', 'NUMERIC(15,2)'),
            ('', 'total_amount', 'NUMERIC(15,2)')
        ]
    },
    'po_lines': {
        'pos': (56, 44, 36, 36),
        'title': 'po_lines',
        'color': '#2563EB',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'po_id', 'INTEGER'),
            ('', 'line_number', 'INTEGER'),
            ('', 'item_description', 'VARCHAR(200)'),
            ('', 'hsn_code', 'VARCHAR(20)'),
            ('', 'quantity', 'NUMERIC(12,2)'),
            ('', 'unit_price', 'NUMERIC(15,2)'),
            ('', 'tax_rate', 'NUMERIC(5,2)'),
            ('', 'total_amount', 'NUMERIC(15,2)')
        ]
    },
    'grn': {
        'pos': (56, 6, 36, 32),
        'title': 'grn (Goods Receipt Note)',
        'color': '#1D4ED8',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('UQ', 'grn_number', 'VARCHAR(50)'),
            ('FK', 'po_id', 'INTEGER'),
            ('FK', 'vendor_id', 'INTEGER'),
            ('', 'receipt_date', 'TIMESTAMP'),
            ('', 'received_by', 'VARCHAR(100)'),
            ('', 'status', 'VARCHAR(30)'),
            ('', 'notes', 'TEXT')
        ]
    },
    'invoices': {
        'pos': (102, 70, 38, 54),
        'title': 'invoices',
        'color': '#0F766E',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('IDX', 'invoice_number', 'VARCHAR(100)'),
            ('FK', 'vendor_id', 'INTEGER'),
            ('IDX', 'po_number_raw', 'VARCHAR(50)'),
            ('', 'vendor_name_raw', 'VARCHAR(150)'),
            ('', 'vendor_gstin_raw', 'VARCHAR(50)'),
            ('', 'invoice_date', 'TIMESTAMP'),
            ('', 'due_date', 'TIMESTAMP'),
            ('', 'subtotal', 'NUMERIC(15,2)'),
            ('', 'tax_amount', 'NUMERIC(15,2)'),
            ('', 'total_amount', 'NUMERIC(15,2)'),
            ('IDX', 'status', 'VARCHAR(50)'),
            ('', 'match_status', 'VARCHAR(50)'),
            ('', 'current_step', 'INTEGER'),
            ('', 'assigned_role', 'VARCHAR(50)'),
            ('', 'ocr_accuracy', 'NUMERIC(5,2)'),
            ('', 'erp_sync_status', 'VARCHAR(30)')
        ]
    },
    'invoice_line_items': {
        'pos': (102, 24, 38, 40),
        'title': 'invoice_line_items',
        'color': '#0F766E',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'invoice_id', 'INTEGER'),
            ('', 'line_number', 'INTEGER'),
            ('', 'description', 'VARCHAR(255)'),
            ('', 'hsn_code', 'VARCHAR(30)'),
            ('', 'quantity', 'NUMERIC(12,2)'),
            ('', 'unit', 'VARCHAR(20)'),
            ('', 'unit_price', 'NUMERIC(15,2)'),
            ('', 'tax_rate', 'NUMERIC(5,2)'),
            ('', 'total_amount', 'NUMERIC(15,2)')
        ]
    },
    'validation_results': {
        'pos': (148, 96, 34, 28),
        'title': 'validation_results',
        'color': '#D97706',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'invoice_id', 'INTEGER'),
            ('', 'rule_code', 'VARCHAR(50)'),
            ('', 'rule_name', 'VARCHAR(100)'),
            ('', 'status', 'VARCHAR(20)'),
            ('', 'severity', 'VARCHAR(20)'),
            ('', 'message', 'TEXT')
        ]
    },
    'po_match_results': {
        'pos': (148, 62, 34, 30),
        'title': 'po_match_results',
        'color': '#7C3AED',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'invoice_id', 'INTEGER'),
            ('FK', 'po_id', 'INTEGER'),
            ('FK', 'grn_id', 'INTEGER'),
            ('', 'match_type', 'VARCHAR(20)'),
            ('', 'status', 'VARCHAR(30)'),
            ('', 'variance_amount', 'NUMERIC(15,2)'),
            ('', 'within_tolerance', 'BOOLEAN')
        ]
    },
    'approval_tasks': {
        'pos': (148, 28, 34, 30),
        'title': 'approval_tasks',
        'color': '#B45309',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'invoice_id', 'INTEGER'),
            ('', 'step_number', 'INTEGER'),
            ('', 'assigned_role', 'VARCHAR(50)'),
            ('FK', 'assigned_user_id', 'INTEGER'),
            ('', 'status', 'VARCHAR(30)'),
            ('', 'actioned_by', 'VARCHAR(100)')
        ]
    },
    'payment_transactions': {
        'pos': (188, 70, 30, 36),
        'title': 'payment_transactions',
        'color': '#059669',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('FK', 'batch_id', 'INTEGER'),
            ('FK', 'invoice_id', 'INTEGER'),
            ('FK', 'vendor_id', 'INTEGER'),
            ('', 'amount', 'NUMERIC(15,2)'),
            ('', 'payment_method', 'VARCHAR(20)'),
            ('IDX', 'utr_number', 'VARCHAR(50)'),
            ('', 'status', 'VARCHAR(30)')
        ]
    },
    'payment_batches': {
        'pos': (188, 28, 30, 36),
        'title': 'payment_batches',
        'color': '#059669',
        'fields': [
            ('PK', 'id', 'SERIAL'),
            ('UQ', 'batch_reference', 'VARCHAR(50)'),
            ('', 'total_amount', 'NUMERIC(15,2)'),
            ('', 'invoice_count', 'INTEGER'),
            ('', 'format_type', 'VARCHAR(30)'),
            ('', 'bank_name', 'VARCHAR(100)'),
            ('', 'status', 'VARCHAR(30)'),
            ('', 'created_at', 'TIMESTAMP')
        ]
    }
}

# Draw tables
for key, tbl in tables.items():
    x, y, w, h = tbl['pos']
    
    # Table background & border
    card = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5,rounding_size=1.2",
                                  facecolor='#121620', edgecolor='#232936', linewidth=1.5, zorder=2)
    ax.add_patch(card)
    
    # Table Header box
    header = patches.FancyBboxPatch((x, y + h - 5.5), w, 5.5, boxstyle="round,pad=0.2,rounding_size=0.8",
                                    facecolor=tbl['color'], edgecolor=tbl['color'], linewidth=0.5, zorder=3)
    ax.add_patch(header)
    
    # Header text
    ax.text(x + w/2, y + h - 2.8, tbl['title'], fontsize=8.5, fontweight='bold', color='#FFFFFF', 
            ha='center', va='center', fontfamily='monospace', zorder=4)
    
    # Field rows
    field_y = y + h - 8.5
    for tag, fname, ftype in tbl['fields']:
        # Tag pill (PK / FK / UQ / IDX)
        if tag == 'PK':
            tag_color = '#F59E0B'
        elif tag == 'FK':
            tag_color = '#38BDF8'
        elif tag in ('UQ', 'IDX'):
            tag_color = '#A78BFA'
        else:
            tag_color = '#475569'
            
        if tag:
            ax.text(x + 2, field_y, tag, fontsize=6, fontweight='bold', color=tag_color,
                    va='center', fontfamily='monospace', zorder=4)
        
        # Field name
        ax.text(x + 7, field_y, fname, fontsize=7, color='#E5E9F0',
                va='center', fontfamily='monospace', zorder=4)
        
        # Field type
        ax.text(x + w - 2, field_y, ftype, fontsize=6, color='#64718A',
                ha='right', va='center', fontfamily='monospace', zorder=4)
        
        field_y -= 2.8

# Draw Relationship Connectors (Arrows)
def draw_connector(start_pt, end_pt, color='#475569', label=''):
    ax.annotate("", xy=end_pt, xytext=start_pt,
                arrowprops=dict(arrowstyle="-|>", color=color, lw=1.2, 
                                shrinkA=3, shrinkB=3, 
                                connectionstyle="arc3,rad=0.05"),
                zorder=1)

# Connectors:
# vendors -> vendor_bank_accounts
draw_connector((28, 82), (28, 74), color='#2DD4BF')
# vendors -> purchase_orders
draw_connector((46, 102), (56, 102), color='#38BDF8')
# vendors -> invoices
draw_connector((46, 92), (102, 92), color='#0D9488')
# purchase_orders -> po_lines
draw_connector((74, 88), (74, 80), color='#38BDF8')
# purchase_orders -> grn
draw_connector((74, 44), (74, 38), color='#38BDF8')
# invoices -> invoice_line_items
draw_connector((121, 70), (121, 64), color='#0D9488')
# invoices -> validation_results
draw_connector((140, 105), (148, 105), color='#F59E0B')
# invoices -> po_match_results
draw_connector((140, 77), (148, 77), color='#A78BFA')
# purchase_orders -> po_match_results
draw_connector((92, 105), (148, 85), color='#818CF8')
# invoices -> approval_tasks
draw_connector((140, 72), (148, 48), color='#FBBF24')
# invoices -> payment_transactions
draw_connector((140, 88), (188, 88), color='#10B981')
# payment_batches -> payment_transactions
draw_connector((203, 64), (203, 70), color='#10B981')

# Legend at bottom
ax.text(25, 4, "KEY CONVENTIONS:", fontsize=7.5, fontweight='bold', color='#E5E9F0', fontfamily='monospace')
ax.text(50, 4, "[PK] Primary Key", fontsize=7, color='#F59E0B', fontfamily='monospace')
ax.text(80, 4, "[FK] Foreign Key", fontsize=7, color='#38BDF8', fontfamily='monospace')
ax.text(110, 4, "[UQ] Unique Key", fontsize=7, color='#A78BFA', fontfamily='monospace')
ax.text(140, 4, "--> 1:N Cascading Relationship", fontsize=7, color='#2DD4BF', fontfamily='monospace')
ax.text(190, 4, "PostgreSQL 16 Engine", fontsize=7, color='#7E8799', fontfamily='monospace')

plt.tight_layout()
plt.savefig("docs/database_schema.png", bbox_inches='tight', facecolor='#0E1117', dpi=300)
plt.savefig("docs/database_schema.svg", bbox_inches='tight', facecolor='#0E1117')
print("Successfully generated docs/database_schema.png and docs/database_schema.svg")
