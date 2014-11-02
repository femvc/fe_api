@echo off
cd C:\Users\home\Desktop\fecampus\fe_api

mongoimport -d campus_api -c cloudlabel  db_cloudlabel.dat
mongoimport -d campus_api -c question      db_question.dat
mongoimport -d campus_api -c paper            db_paper.dat
mongoimport -d campus_api -c result          db_result.dat
mongoimport -d campus_api -c rank              db_rank.dat
cmd 
