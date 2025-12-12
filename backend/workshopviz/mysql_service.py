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

    def add_notes(self, dashboardId, asset_id, asset_name, description, category, startDate, startTime, endDate, endTime, user_id ):
        """Add note to a booking"""
        try:
            if not self.connect():
                return False
            cursor = self.connection.cursor()
            query = "INSERT INTO visualisation_notes (iAsset_id, iDashboard_id, vAsset_name, vDesc, vCategory, dStart, tStart, dEnd, tEnd, iUser_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(query, (asset_id, dashboardId, asset_name, description, category, startDate, startTime, endDate, endTime, user_id))
            self.connection.commit()
            cursor.close()
            return True
        except Exception as e:
            logger.error(f"Error adding note to booking: {str(e)}")
            return False
        finally:
            self.close()

    def get_machine_assets(self):
        """Get all machine assets from the database that have asset type 'Machine'"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            # Query to get all assets of type 'Machine'
            query = """
                SELECT DISTINCT a.iAsset_id, a.vName
                FROM assets a
                INNER JOIN asset_type_assoc asta ON a.iAsset_id = asta.iAsset_id
                INNER JOIN asset_type ast ON asta.iAsset_type_id = ast.iAst_type_id
                WHERE ast.vName = 'Machine' AND a.cStatus = 'A'
                ORDER BY a.vName
            """
            
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting machine assets: {str(e)}")
            return None
        finally:
            self.close()

    def create_dashboard(self, title, asset_id, user_id, category):
        """Create a new dashboard entry in visualisation_dashboards table"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            # Insert query
            query = """
                INSERT INTO visualisation_dashboards 
                (vTitle, iAsset_id, iUser_id, cCategory) 
                VALUES (%s, %s, %s, %s)
            """
            
            cursor.execute(query, (title, asset_id, user_id, category))
            self.connection.commit()
            
            # Get the inserted dashboard ID
            dashboard_id = cursor.lastrowid
            cursor.close()
            
            return dashboard_id
            
        except Exception as e:
            logger.error(f"Error creating dashboard: {str(e)}")
            return None
        finally:
            self.close()

    def get_all_dashboards(self):
        """Get all dashboards from visualisation_dashboards table"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            query = """
                SELECT iDashboard_id, vTitle, iAsset_id, iUser_id, dtCreated, dtModified, cCategory
                FROM visualisation_dashboards
                ORDER BY dtModified DESC
            """
            cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            
            return results
            
        except Exception as e:
            logger.error(f"Error fetching dashboards: {str(e)}")
            return None
        finally:
            self.close()

    def create_component(self, dashboard_id, v_title, v_description, i_position, v_query):
        """Create a new component in visualisation_component_data table"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            # Convert vQuery dict to JSON string
            import json
            v_query_json = json.dumps(v_query)
            
            query = """
                INSERT INTO visualisation_component_data 
                (iDashboard_id, vTitle, vDescription, iPosition, vQuery, cAddToDashboard, dtCreated, dtModified)
                VALUES (%s, %s, %s, %s, %s, 'Y', NOW(), NOW())
            """
            cursor.execute(query, (dashboard_id, v_title, v_description, i_position, v_query_json))
            self.connection.commit()
            
            component_id = cursor.lastrowid
            
            # Fetch the created component
            cursor.execute("""
                SELECT icomponent_id, iDashboard_id, vTitle, vDescription, iPosition, vQuery, 
                       cAddToDashboard, dtCreated, dtModified
                FROM visualisation_component_data
                WHERE icomponent_id = %s
            """, (component_id,))
            result = cursor.fetchone()
            cursor.close()
            
            # Parse vQuery JSON back to dict
            if result and result['vQuery']:
                result['vQuery'] = json.loads(result['vQuery'])
            
            return result
            
        except Exception as e:
            logger.error(f"Error creating component: {str(e)}")
            return None
        finally:
            self.close()

    def get_components_by_dashboard(self, dashboard_id):
        """Get all components for a specific dashboard"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            query = """
                SELECT icomponent_id, iDashboard_id, vTitle, vDescription, iPosition, vQuery,
                       cAddToDashboard, dtCreated, dtModified
                FROM visualisation_component_data
                WHERE iDashboard_id = %s AND cAddToDashboard = 'Y'
                ORDER BY iPosition, dtCreated
            """
            cursor.execute(query, (dashboard_id,))
            results = cursor.fetchall()
            cursor.close()
            
            # Parse vQuery JSON for each component
            import json
            for result in results:
                if result['vQuery']:
                    result['vQuery'] = json.loads(result['vQuery'])
            
            return results
            
        except Exception as e:
            logger.error(f"Error fetching components for dashboard {dashboard_id}: {str(e)}")
            return None
        finally:
            self.close()

    def get_component_by_id(self, component_id):
        """Get a single component by ID"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            query = """
                SELECT icomponent_id, iDashboard_id, vTitle, vDescription, iPosition, vQuery,
                       cAddToDashboard, dtCreated, dtModified
                FROM visualisation_component_data
                WHERE icomponent_id = %s
            """
            cursor.execute(query, (component_id,))
            result = cursor.fetchone()
            cursor.close()
            
            # Parse vQuery JSON
            import json
            if result and result['vQuery']:
                result['vQuery'] = json.loads(result['vQuery'])
            
            return result
            
        except Exception as e:
            logger.error(f"Error fetching component {component_id}: {str(e)}")
            return None
        finally:
            self.close()

    def update_component(self, component_id, v_title, v_description, i_position, v_query):
        """Update an existing component"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor(dictionary=True)
            
            # Convert vQuery dict to JSON string
            import json
            v_query_json = json.dumps(v_query)
            
            query = """
                UPDATE visualisation_component_data
                SET vTitle = %s, vDescription = %s, iPosition = %s, vQuery = %s, dtModified = NOW()
                WHERE icomponent_id = %s
            """
            cursor.execute(query, (v_title, v_description, i_position, v_query_json, component_id))
            self.connection.commit()
            
            rows_affected = cursor.rowcount
            
            if rows_affected > 0:
                # Fetch the updated component
                cursor.execute("""
                    SELECT icomponent_id, iDashboard_id, vTitle, vDescription, iPosition, vQuery,
                           cAddToDashboard, dtCreated, dtModified
                    FROM visualisation_component_data
                    WHERE icomponent_id = %s
                """, (component_id,))
                result = cursor.fetchone()
                cursor.close()
                
                # Parse vQuery JSON
                if result and result['vQuery']:
                    result['vQuery'] = json.loads(result['vQuery'])
                
                return result
            else:
                cursor.close()
                return None
            
        except Exception as e:
            logger.error(f"Error updating component {component_id}: {str(e)}")
            return None
        finally:
            self.close()

    def delete_component(self, component_id):
        """Delete a component by ID"""
        try:
            if not self.connect():
                return None
            
            cursor = self.connection.cursor()
            
            query = "DELETE FROM visualisation_component_data WHERE icomponent_id = %s"
            cursor.execute(query, (component_id,))
            self.connection.commit()
            
            rows_affected = cursor.rowcount
            cursor.close()
            
            return rows_affected > 0
            
        except Exception as e:
            logger.error(f"Error deleting component {component_id}: {str(e)}")
            return None
        finally:
            self.close()

    def close(self):
        """Close the MySQL connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()