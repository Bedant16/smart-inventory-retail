#!/usr/bin/env python3
"""Regenerates seed.sql. Stock, sales and stock movements are generated together so that
products.current_stock always equals the replayed inventory_transactions ledger.
Needs `npm install` in ../backend first (password hashes use bcryptjs).  Usage: python3 generate_seed.py"""
import datetime as dt, math, os, random, subprocess
random.seed(42)
HERE = os.path.dirname(os.path.abspath(__file__))
q = lambda s: "'" + str(s).replace("'", "''") + "'"

def hash_pw(pw):
    js = "console.log(require('bcryptjs').hashSync(process.argv[1],10))"
    return subprocess.check_output(['node', '-e', js, pw], cwd=os.path.join(HERE, '..', 'backend')).decode().strip()

USERS = [("Admin User", "admin@store.local", "admin123", "ADMIN"),
         ("Meera Nair", "manager@store.local", "manager123", "MANAGER"),
         ("Arun Kumar", "staff@store.local", "staff123", "STAFF")]
CATS = [("Beverages", "BEV"), ("Snacks", "SNK"), ("Groceries", "GRO"), ("Personal Care", "PER"), ("Household", "HOU"), ("Electronics", "ELE")]
SUPS = [("Coastal Beverages Distribution", "Ravi Shankar", "ravi@coastalbev.example", "+91 98400 11201"),
        ("Madras Snack Traders", "Lakshmi Iyer", "orders@madrassnacks.example", "+91 98410 22302"),
        ("Southern Provisions Co.", "Imran Basha", "imran@southernprov.example", "+91 98420 33403"),
        ("Bay Personal Care Supplies", "Divya Menon", "divya@baycare.example", "+91 98430 44504"),
        ("Greenline Household Wholesale", "Karthik Raja", "karthik@greenline.example", "+91 98440 55605"),
        ("Voltix Electronics Distributors", "Suresh Babu", "suresh@voltix.example", "+91 98450 66706")]
# name, category, price, cost, unit, avg daily sales, minimum, reorder level, current stock
P = [("Coca-Cola 500ml",1,40,31,"bottle",7,12,25,18), ("Pepsi 500ml",1,40,31,"bottle",5,10,25,52),
 ("Bisleri Water 1L",1,20,14,"bottle",11,15,25,28), ("Frooti Mango 200ml",1,20,15,"pack",6,12,30,34),
 ("Real Fruit Juice Mixed 1L",1,120,96,"carton",2,4,10,5), ("Nescafe Classic 100g",1,360,290,"jar",1.5,4,8,7),
 ("Lay's Classic Salted 52g",2,20,15.5,"pack",9,18,40,66), ("Kurkure Masala Munch 90g",2,30,23,"pack",6,12,30,26),
 ("Parle-G Biscuits 250g",2,25,19.5,"pack",8,15,35,70), ("Britannia Good Day 200g",2,40,32,"pack",4,8,20,41),
 ("Oreo Original 120g",2,40,31,"pack",3,6,15,30), ("Haldiram's Aloo Bhujia 200g",2,60,47,"pack",3,6,15,4),
 ("Aashirvaad Atta 5kg",3,285,248,"bag",3,6,14,22), ("India Gate Basmati Rice 5kg",3,640,560,"bag",1.5,4,10,16),
 ("Tata Salt 1kg",3,28,23,"pack",5,10,25,58), ("Fortune Sunflower Oil 1L",3,155,138,"pouch",4,8,20,12),
 ("Toor Dal 1kg",3,165,140,"pack",3,6,15,24), ("Sugar 1kg",3,46,40,"pack",5,10,25,48),
 ("Tata Tea Gold 250g",3,150,126,"pack",3,6,15,9), ("Amul Taaza Milk 1L",3,56,52,"packet",14,10,40,6),
 ("Maggi 2-Minute Noodles 70g",3,14,11,"pack",20,30,80,142), ("Amul Butter 100g",3,62,54,"pack",4,8,18,34),
 ("Colgate Strong Teeth 200g",4,110,88,"tube",2.5,5,12,30), ("Dettol Original Soap 125g",4,48,38,"bar",4,8,20,3),
 ("Clinic Plus Shampoo 340ml",4,190,152,"bottle",1.5,4,10,18), ("Dove Cream Beauty Bar 100g",4,65,52,"bar",2.5,5,12,10),
 ("Head & Shoulders 340ml",4,330,268,"bottle",1,3,8,14), ("Nivea Soft Cream 100ml",4,175,140,"jar",1,3,8,11),
 ("Surf Excel Easy Wash 1kg",5,135,112,"pack",3,6,14,28), ("Vim Dishwash Liquid 500ml",5,110,89,"bottle",2.5,5,12,20),
 ("Harpic Power Plus 500ml",5,105,84,"bottle",2,4,10,6), ("Lizol Floor Cleaner 975ml",5,215,175,"bottle",1.5,4,10,19),
 ("Scotch-Brite Scrub Pad 3pk",5,60,46,"pack",3,6,14,36), ("Garbage Bags Medium 30ct",5,120,94,"pack",2,4,10,17),
 ("Duracell AA Batteries 4pk",6,190,152,"pack",1.5,4,10,3), ("USB-C Cable 1m",6,299,190,"piece",1,3,8,15),
 ("boAt Bassheads 100 Earphones",6,499,330,"piece",0.8,2,6,9), ("Philips LED Bulb 9W",6,99,68,"piece",3,6,15,44),
 ("Havells 4-Socket Power Strip",6,550,420,"piece",0.7,2,5,8)]

def poisson(lam):
    L, k, p = math.exp(-lam), 0, random.random()
    while p > L:
        k += 1; p *= random.random()
    return k
ts = lambda d, s: f"LEAST(NOW(), TIMESTAMP(CURDATE() - INTERVAL {d} DAY, '{s//3600:02d}:{s%3600//60:02d}:{s%60:02d}'))"
key = lambda d, s: (-d) * 86400 + s
today = dt.date.today()
users_staff = [2, 3]

sales = []
for pid, p in enumerate(P, 1):
    avg = p[5]
    for d in range(29, -1, -1):
        wk = today - dt.timedelta(days=d)
        n = poisson(avg * (1.25 if wk.weekday() >= 5 else 0.9))
        while n > 0:
            q_ = min(n, random.choice([1, 1, 1, 2, 2, 3, 6] if avg >= 5 else [1, 1, 2]))
            n -= q_
            s = random.randint(9 * 3600, 21 * 3600)
            sales.append(dict(pid=pid, qty=q_, d=d, s=s, k=key(d, s), by=random.choice(users_staff)))
sales.sort(key=lambda x: x['k'])
for i, s in enumerate(sales, 1): s['id'] = i

# one received purchase order per supplier, 10 days ago
RECV_D, RECV_S = 10, 9 * 3600 + 1800
po_items, events = [], []
for sup in range(1, 7):
    for pid, p in enumerate(P, 1):
        if p[1] != sup: continue
        after = sum(x['qty'] for x in sales if x['pid'] == pid and x['k'] > key(RECV_D, RECV_S))
        Q = min(math.ceil(p[7] * 2), p[8] + after)
        if Q > 0:
            po_items.append((sup, pid, Q, p[3]))
            events.append(dict(pid=pid, type='PURCHASE', qty=Q, d=RECV_D, s=RECV_S, k=key(RECV_D, RECV_S), ref=sup, by=2, notes=f"Received against PO-{sup:04d}"))
for x in sales:
    events.append(dict(pid=x['pid'], type='SALE', qty=-x['qty'], d=x['d'], s=x['s'], k=x['k'], ref=x['id'], by=x['by'], notes=None))
events.sort(key=lambda e: (e['k'], e['type'] != 'PURCHASE'))
init = {}
for pid, p in enumerate(P, 1):
    init[pid] = p[8] - sum(e['qty'] for e in events if e['pid'] == pid)
    assert init[pid] >= 0, p[0]
run = dict(init)
for e in events:
    e['prev'] = run[e['pid']]; run[e['pid']] += e['qty']; e['new'] = run[e['pid']]
    assert e['new'] >= 0, (P[e['pid'] - 1][0], e)
for pid, p in enumerate(P, 1): assert run[pid] == p[8]
# opening stock rows 31 days ago
opening = [dict(pid=pid, type='ADJUSTMENT', qty=init[pid], d=31, s=8 * 3600, k=key(31, 8 * 3600), ref=None, by=1, prev=0, new=init[pid], notes='Opening stock') for pid in init if init[pid] > 0]
events = sorted(opening + events, key=lambda e: e['k'])

out = ["-- Generated by generate_seed.py. Demo data: 39 products, 30 days of sales.", "USE retail_inventory;", ""]
out.append("INSERT INTO users (id,name,email,password_hash,role) VALUES\n" + ",\n".join(f"({i},{q(n)},{q(e)},{q(hash_pw(pw))},{q(r)})" for i, (n, e, pw, r) in enumerate(USERS, 1)) + ";")
out.append("INSERT INTO categories (id,name) VALUES\n" + ",\n".join(f"({i},{q(c[0])})" for i, c in enumerate(CATS, 1)) + ";")
out.append("INSERT INTO suppliers (id,name,contact_person,email,phone) VALUES\n" + ",\n".join(f"({i},{q(a)},{q(b)},{q(c)},{q(d)})" for i, (a, b, c, d) in enumerate(SUPS, 1)) + ";")
counters, rows = {}, []
for pid, p in enumerate(P, 1):
    counters[p[1]] = counters.get(p[1], 0) + 1
    rows.append(f"({pid},{q(CATS[p[1]-1][1] + '-%03d' % counters[p[1]])},{q(p[0])},{p[1]},{p[1]},{p[2]},{p[3]},{p[8]},{p[6]},{p[7]},{q(p[4])})")
out.append("INSERT INTO products (id,sku,name,category_id,supplier_id,price,cost_price,current_stock,minimum_stock,reorder_level,unit) VALUES\n" + ",\n".join(rows) + ";")

pos, items = [], []
for sup in range(1, 7):
    tot = sum(q_ * c for s_, _, q_, c in po_items if s_ == sup)
    pos.append(f"({sup},{sup},'RECEIVED',CURDATE() - INTERVAL 12 DAY,CURDATE() - INTERVAL 10 DAY,{tot})")
nxt = 7
for sup in range(1, 7):
    need = [(pid, max(P[pid-1][7] * 2 - P[pid-1][8], 1), P[pid-1][3]) for pid in range(1, len(P) + 1) if P[pid-1][1] == sup and P[pid-1][8] <= P[pid-1][7]]
    if not need: continue
    pos.append(f"({nxt},{sup},'ORDERED',CURDATE() - INTERVAL 1 DAY,CURDATE() + INTERVAL 3 DAY,{sum(int(a) * c for _, a, c in need)})")
    items += [(nxt, pid, int(a), c) for pid, a, c in need]; nxt += 1
items = [(s_, pid, q_, c) for s_, pid, q_, c in po_items] + items
out.append("INSERT INTO purchase_orders (id,supplier_id,status,order_date,expected_date,total_amount) VALUES\n" + ",\n".join(pos) + ";")
out.append("INSERT INTO purchase_order_items (purchase_order_id,product_id,quantity,unit_cost) VALUES\n" + ",\n".join(f"({a},{b},{c},{d})" for a, b, c, d in items) + ";")
out.append("INSERT INTO sales (id,product_id,quantity,unit_price,total_amount,sold_at,sold_by) VALUES\n" + ",\n".join(
    f"({x['id']},{x['pid']},{x['qty']},{P[x['pid']-1][2]},{x['qty']*P[x['pid']-1][2]},{ts(x['d'], x['s'])},{x['by']})" for x in sales) + ";")
out.append("INSERT INTO inventory_transactions (product_id,transaction_type,quantity,previous_stock,new_stock,reference_id,transaction_date,notes,created_by) VALUES\n" + ",\n".join(
    f"({e['pid']},{q(e['type'])},{e['qty']},{e['prev']},{e['new']},{e['ref'] if e['ref'] else 'NULL'},{ts(e['d'], e['s'])},{q(e['notes']) if e['notes'] else 'NULL'},{e['by']})" for e in events) + ";")
out.append("-- Alerts are not seeded: the backend derives them from stock and sales on startup and after every stock change.")
open(os.path.join(HERE, 'seed.sql'), 'w').write("\n\n".join(out) + "\n")
print(f"seed.sql written: {len(P)} products, {len(sales)} sales, {len(events)} stock movements")
