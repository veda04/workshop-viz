import logging
import mysql.connector
from django.conf import settings
from datetime import datetime, date, time

logger = logging.getLogger(__name__)

class MySQLService:
    def __init__(self):
        self.config = {
            'host': settings.MYSQL_HOST,
            'user': settings.MYSQL_USER,
            'password': settings.MYSQL_PASSWORD,
            'database': settings.MYSQL_DB_NAME,
            'port': settings.MYSQL_PORT
        }
        self.connection = None

    def connect(self):
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            return True
        except mysql.connector.Error as e:
            logger.error(f"MySQL connection failed: {str(e)}")
            return False

    def test_connection(self):
        """Test the connection to MySQL database"""
        try:
            if self.connect():
                cursor = self.connection.cursor()
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
                cursor.close()
                return {
                    'status': 'success',
                    'message': 'Connected to MySQL successfully',
                    'server_info': self.connection.get_server_info()
                }
        except Exception as e:
            logger.error(f"MySQL connection test failed: {str(e)}")
            return {
                'status': 'error',
                'message': f'Failed to connect to MySQL: {str(e)}'
            }
        finally:
            self.close()

    def get_machine_id(self, machine_name):
        """Get current machine ID for a machine"""
        try:
            if not self.connect():
                return None

            cursor = self.connection.cursor(dictionary=True)

            query = "SELECT iAsset_id FROM assets WHERE vName = %s"
            cursor.execute(query, (machine_name,))
            result = cursor.fetchone()
            cursor.close()
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting current asset id: {str(e)}")
            return None
        finally:
            self.close()

    def get_machine_related_bookings(self, machine_id):
        """Get all the bookings related to the machine"""
        try: 
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)

            query = "SELECT a.iBooking_id FROM booking_asset a LEFT JOIN booking b ON a.iBooking_id = b.iBooking_id WHERE a.iAsset_id = %s ORDER BY b.dStart DESC"
            cursor.execute(query, (machine_id,))
            results = cursor.fetchall()
            cursor.close()

            return results
        
        except Exception as e:
            logger.error(f"Error getting machine related bookings: {str(e)}")
            return None

    def get_booking_list(self, condition=""):
        """Get booking list based on the condition"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            b_arr = self.get_bookings(cursor, condition)

            return b_arr
        
        except Exception as e:
            logger.error(f"Error getting booking list: {str(e)}")
            return None
    
    def get_bookings(self, cursor, condition):
        """Get bookings based on the condition"""
        try:
            query = f"SELECT * FROM booking WHERE 1=1 {condition}"
            # need to execute another query to get the sub assets if required
            cursor.execute(query)
            results = cursor.fetchall()
            return results
        except Exception as e:
            logger.error(f"Error getting bookings: {str(e)}")
            return None
        
    def get_booked_by_user(self, user_id):
        """Get the user who booked the machine"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)

            query = "SELECT vName FROM users WHERE iUser_id = %s"
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            cursor.close()

            return result['vName'] if result else None
            
        except Exception as e:
            logger.error(f"Error getting booked by user: {str(e)}")
            return None
        
    def get_user_list(self):
        """Get the list of users"""
        try:
            if not self.connect():
                return None
            cursor = self.connection.cursor(dictionary=True)
            query = "SELECT iUser_id, vName FROM users WHERE iUser_id > 2"
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            return results
        except Exception as e:
            logger.error(f"Error getting user list: {str(e)}")
            return None
        finally:
            self.close()

    def get_asset_id_by_name(self, asset_name):
        """Get asset ID by asset name"""
        try:
            if not self.connect():
                return None
            cursor = self.connection.cursor(dictionary=True)
            query = "SELECT iAsset_id FROM assets WHERE vName = %s"
            cursor.execute(query, (asset_name,))
            result = cursor.fetchone()
            cursor.close()
            return result['iAsset_id'] if result else None
        except Exception as e:
            logger.error(f"Error getting asset ID by name: {str(e)}")
            return None
        finally:
            self.close()

    def add_notes(self, asset_id, asset_name, description, category, startDate, startTime, endDate, endTime, user_id ):
        """Add note to a booking"""
        try:
            if not self.connect():
                return False
            cursor = self.connection.cursor()
            query = "INSERT INTO machine_notes (iAsset_id, vAsset_name, vDesc, vCategory, dStart, tStart, dEnd, tEnd, iUser_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(query, (asset_id, asset_name, description, category, startDate, startTime, endDate, endTime, user_id))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            logger.error(f"Error adding note to booking: {str(e)}")
            return False
        finally:
            self.close()

    def save_custom_graph(self, asset_id, title, graph_types_json, series_json, user_id, add_to_dashboard):
        """Save custom graph configuration"""
        try:
            if not self.connect():
                return False
            cursor = self.connection.cursor()
            query = """
                INSERT INTO machine_custom_graphs 
                (vTitle, iAsset_id, vGraph_types, vSeries, iUser_id, cAddToDashboard) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (title, asset_id, graph_types_json, series_json, user_id, add_to_dashboard))
            self.connection.commit()
            graph_id = cursor.lastrowid
            cursor.close()
            return graph_id
        except Exception as e:
            logger.error(f"Error saving custom graph: {str(e)}")
            return False
        finally:
            self.close()

    # get the list of customised graphs for a machine
    def get_custom_graphs(self, asset_id):
        """Get the list of customised graphs for a machine"""
        try:
            if not self.connect():
                return None
            cursor = self.connection.cursor(dictionary=True)
            query = "SELECT * FROM machine_custom_graphs WHERE iAsset_id = %s"
            cursor.execute(query, (asset_id,))
            results = cursor.fetchall()
            cursor.close()
            return results
        except Exception as e:
            logger.error(f"Error getting custom graphs: {str(e)}")
            return None
        finally:
            self.close()

    def close(self):
        """Close the MySQL connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()