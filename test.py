import pymysql.cursors
connection = pymysql.connect(host='localhost',
                             user='root',
                             password='123',
                             database='diem',
                             cursorclass=pymysql.cursors.DictCursor)
q = "select MaNganh  from nganh_thpt where Diem<=24.5 order by Diem DESC limit 1"
result = connection.query(q)
print (result)
