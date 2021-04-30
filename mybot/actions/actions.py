from typing import Any, Text, Dict, List

import mysql.connector as mysql
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher


class ActionRecommendByScore(Action):

    def name(self) -> Text:
        return "action_recomend_by_score"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        entities = tracker.latest_message['entities']
        raw_text = tracker.latest_message.get('text')
        score, score_txt, hoc_ba = None, None, None
        entities = sorted(entities, key=lambda tup: (tup['entity'], tup['start'], tup['end']))
        print('Sorted entities: ', entities)
        for x in entities:
            if x['entity'] == 'hoc_ba':
                hoc_ba = x
        for x in entities:
            for y in entities:
                if x['entity'] == 'number' and y['entity'] == 'score_txt' and x['end'] == y['start'] - 1:
                    score = x
                    score_txt = y
                    break
        if score is not None and score_txt is not None:
            score = score['additional_info']['value']
            print('Score txt: ', score_txt)
            raw_score_txt = raw_text[score_txt['start']: score_txt['end']].lower()
            print('Raw score txt: ', raw_score_txt)
            if raw_score_txt == 'diem ruoi':
                score += 0.5
            output_html = 'Danh sách (top 5) các ngành bạn có thể đỗ: <br> <br>'

            db = mysql.connect(
                host="localhost",
                user="nghiatt",
                passwd="123456",
                database="diem",
                auth_plugin='mysql_native_password'
            )
            cursor = db.cursor()

            if hoc_ba is None:
                query = "select * from nganh_thpt where Diem <= " + str(score) + " order by diem desc limit 5"
            else:
                query = "select * from nganh_hocba where Diem <= " + str(score) + " order by diem desc limit 5"

            cursor.execute(query)
            records = cursor.fetchall()

            print('Records: ', records)

            output_html = output_html + ' <style> table {   font-family: arial, sans-serif;   border-collapse: collapse; ' \
                                        '  width: 100%; }  td, th {   border: 1px solid #dddddd;   text-align: left;   padding: 8px; } ' \
                                        ' </style> '
            output_html = output_html + ' <table><tr><th>Mã ngành</th><th>Tên ngành</th><th>Điểm</th><th>Tổ hợp môn</th></tr>'

            for record in records:
                output_html = output_html + ' <tr><td>' + str(record[0]) + '</td><td>' + str(record[1]) + '</td><td>' + str(record[2]) + '</td><td>' + str(record[3]) + '</td></tr> '

            output_html = output_html + ' </table>'

            if not records:
                output_html = 'Rất tiếc, chưa có ngành nào phù hợp với điểm của bạn'

            dispatcher.utter_message(output_html)
            return []
        dispatcher.utter_message('Xin lỗi, tôi chưa hiểu ý bạn.')
        return []

