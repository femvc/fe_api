@echo off
cd C:\Users\home\Desktop\fecampus\fe_api

mongoexport -d campus_api -c cloudlabel -o db_cloudlabel.dat
mongoexport -d campus_api -c question   -o   db_question.dat
mongoexport -d campus_api -c paper      -o      db_paper.dat
mongoexport -d campus_api -c result     -o     db_result.dat
mongoexport -d campus_api -c rank       -o       db_rank.dat
cmd 
