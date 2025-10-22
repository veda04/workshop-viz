##################################################
## Author: Ashley Cusack
## Email: A.Cusack2@hud.ac.uk
##################################################
## File Name: newDashQuery.py
## File Type: Python Executable
## Package Dependancies: influxdb-client
## Description: Used to get data from InfluxDB for displaying on a dashboard
## Usage: Runs as main function, or using getInfluxData is calling from an external source
##################################################
## Version: 0.0.2
## Last Updated: 23/07/2025
##################################################


from datetime import datetime, timedelta, date
import os
import pprint
from influxdb_client import InfluxDBClient
import json
import pandas as pd
from time import perf_counter
from time import sleep
import random
import pprint
import pytz

INFLUX_TOKEN = "pRoemIh7JfC7cn1HG2VyZcx1BSIguLN-gqhQyKl8775tpvDV4o9NNf1FuLMDKKvKaVEj1wDKiPouKsbvSS6s5Q=="
DB_LINK = "http://10.101.23.23:8086"
DB_ORG = "ECMPG"

INTERVAL_POINTS = [1,2,5,10,20,30,60]
FULL_SCREEN_POINTS = 1500
MINIMISED_POINTS = 500

def _connect_influxDB(timeout=30_000):
	########## InfluxDB Initialisation ##########

	client = None
	health = None
	attempts = 0
	while(True):
		client = InfluxDBClient(url=DB_LINK, token=INFLUX_TOKEN, org=DB_ORG, timeout=timeout)
		health = client.health()

		if(health.status == "pass"):
			return client.query_api()
		attempts+=1
		sleep(5)
		

def calculateAggregation(range,maxPoints, endDatetime):
	"""
	Calculates an appropriate aggregation interval for downsampling time-series data 
	based on the total time range and the maximum number of data points desired.

	Parameters:
		range (str): The time range string (e.g., '1h', '7d', '30m') using suffixes 
					 like 's' (seconds), 'm' (minutes), 'h' (hours), 'd' (days), 
					 'w' (weeks), or 'M' (months — assumed to be 30 days).
		maxPoints (int): The maximum number of points to be returned in the result set.

	Returns:
		str: The aggregation interval as a string (e.g., '5s', '1m', '30m'), 
			 chosen from a predefined list (`INTERVAL_POINTS`) to match the 
			 rough interval needed.
	"""
	if not isinstance(range, str) or len(range) < 2 or not range[:-1].isdigit():
		raise ValueError(f"Invalid range format: '{range}'. Expected format like '1h', '7d', etc.")
	try:
		offsetAmount = int(range[:-1])
		unitQuantifier = range[-1]
	except Exception as e:
		raise ValueError(f"Error parsing range '{range}': {e}")
	match unitQuantifier:
		case "s":
			startDateTime = endDatetime - timedelta(seconds=offsetAmount)
		case "m":
			startDateTime = endDatetime - timedelta(minutes=offsetAmount)
		case "h":
			startDateTime = endDatetime - timedelta(hours=offsetAmount)
		case "d":
			startDateTime = endDatetime - timedelta(days=offsetAmount)
		case "w":
			startDateTime = endDatetime - timedelta(weeks=offsetAmount)
		case "M":
			startDateTime = endDatetime - timedelta(days=offsetAmount*30) # Assuming 30 days in a month
		case _:
			raise ValueError(f"Unknown time unit in range: '{unitQuantifier}'")
			startDateTime = endDatetime - timedelta(days=offsetAmount*30) # Assuming 30 days in a month
	
	print(f"Start: {startDateTime}, End: {endDatetime}")

	duration = (endDatetime-startDateTime).total_seconds()
	intervalUnits = "s"
	rough_interval = duration / maxPoints
	
	if(rough_interval >60):
		rough_interval /= 60
		intervalUnits = "m"
	chosen_interval = 1
	for interval in INTERVAL_POINTS:
		if(rough_interval < interval):
			chosen_interval = interval
			break
	print(f"Rough Interval: {rough_interval} seconds\nChosen Interval: {chosen_interval} seconds")
	return f"{chosen_interval}{intervalUnits}"

def _buildQuery(queryDict,range,type,minimised,requestedRange):
	"""
	Builds an InfluxDB Flux query based on the input parameters and modifies it
	depending on the visualisaton type and minimisation flag.

	Parameters:
		flux (str): The base Flux query template with placeholders.
		range (str): The time range string (e.g., '1h', '7d') to replace in the query.
		type (str): The type of query, either "Stat" or "Graph".
		minimised (bool): Whether the query should be optimised for minimal display (e.g., in small UI components).

	Returns:
		str: The constructed Flux query with appropriate replacements and adjustments.
	"""

	maxPointsToFetch  = FULL_SCREEN_POINTS
	query = queryDict.get("Flux")
	if(type== "Stat" and minimised == True):
		print("Stat query is minimised, get last value")
		query = query + "|> last()"
	elif(type == "Graph" and minimised == True):
		print("Graph query is minimised, use bigger interval")
		maxPointsToFetch = MINIMISED_POINTS
	#print("QueryDICT", queryDict)

	if requestedRange and ('start' in requestedRange and 'end' in requestedRange):
		try:
			startDate = requestedRange['start']
			endDate = requestedRange['end']
			
			# Try multiple datetime formats to handle different input formats
			formats = ["%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"]
			
			startDateTime = None
			endDateTime = None
			
			for fmt in formats:
				try:
					startDateTime = datetime.strptime(startDate, fmt)
					endDateTime = datetime.strptime(endDate, fmt)
					break
				except ValueError:
					continue
			
			if startDateTime is None or endDateTime is None:
				raise ValueError(f"Unable to parse dates with formats: {formats}")
			
			# **FIX: Assume input times are in BST/GMT and convert to UTC**
			local_tz = pytz.timezone('Europe/London')
			
			# Localize the naive datetime to BST/GMT depending on the current timezone
			startDateTime = local_tz.localize(startDateTime)
			endDateTime = local_tz.localize(endDateTime)
			
			# Convert to UTC for InfluxDB query as InfluxDB stores times in UTC
			startDateTime_utc = startDateTime.astimezone(pytz.UTC)
			endDateTime_utc = endDateTime.astimezone(pytz.UTC)
			
			#print(f"User requested: {startDateTime} to {endDateTime}")
			#print(f"Querying InfluxDB (UTC): {startDateTime_utc} to {endDateTime_utc}")
			
			# Calculate range in minutes and update query parameters
			range = f"{int((endDateTime - startDateTime).total_seconds() / 60)}m"
			query = query.replace("v.timeRangeStart", startDateTime_utc.isoformat())
			query = query.replace("v.timeRangeStop", endDateTime_utc.isoformat())
			
			# Use UTC datetime for aggregation calculation
			endDateTime = endDateTime_utc
		except (KeyError, ValueError, TypeError) as e:
			print(f"Error parsing requested range: {e}")
			# Fallback to default range behavior
			query = query.replace("v.timeRangeStart", f"-{range}")
			query = query.replace("v.timeRangeStop", "now()")
			endDateTime = datetime.now(pytz.UTC)
	else:
		query = query.replace("v.timeRangeStart", f"-{range}")
		query = query.replace("v.timeRangeStop", "now()")
		endDateTime = datetime.now(pytz.UTC)

	# AC code: commented out - replaced with above code:  
	# if("RequestedRange" in queryDict):
	# 	requestedRange = queryDict.get("RequestedRange")
	# 	startDate = requestedRange.get("from")
	# 	endDate = requestedRange.get("to")

	# 	fmt = "%Y-%m-%dT%H:%M"
	# 	startDateTime = datetime.strptime(startDate,fmt)
	# 	endDateTime = datetime.strptime(endDate,fmt)
	# 	range = f"{int((endDateTime - startDateTime).total_seconds() / 60)}m"
	# 	query = query.replace("v.timeRangeStart", startDateTime.isoformat() + "Z")
	# 	query = query.replace("v.timeRangeStop", endDateTime.isoformat() + "Z")
	# else:
	# 	query = query.replace("v.timeRangeStart", f"-{range}")
	# 	query = query.replace("v.timeRangeStop", f"now()")
	# 	endDateTime = datetime.now()
		
	query = query.replace("v.windowPeriod", calculateAggregation(range,maxPointsToFetch,endDateTime)) #This is a temporary fix, as the window period is not used in this query

	return query

def _runQuery(query):
	"""
	Connects to the InfluxDB and runs an InfluxDB Flux query 
	
	Parameters:
		query (str): The Flux query to be executed

	Returns:
		FluxRecord (List): The returned data from the query
	"""
	read_api = _connect_influxDB()
	getRecords =  read_api.query(org="ECMPG",query=query)
	return getRecords

def _parseJSONQuery(jsonQuery):
	"""
	Parses a JSON-formatted query object and extracts relevant fields for query generation.

	Parameters:
		jsonQuery (dict): A dictionary containing query metadata, typically with keys:
			- "Type" (str): The type of the visualisation (e.g., "Stat", "Graph").
			- "DefaultRange" (str): The default time range for the query.
			- "Minimised" (bool): Whether the visualisation is in a minimised form.
			- "RequestedRange" (str): The specific time range requested
			- "Queries" (list): The actual query content or query definitions.

	Returns:
		tuple: A tuple containing:
			- Queries: The list of InfluxDB queries and their parameters.
			- defaultRange (str): The default time range (eg. 3h,1d).
			- type (str): The query type (eg. Graph/Stat).
			- minimised (bool): The minimisation flag.
	"""
	type = jsonQuery.get("Type")
	defaultRange = jsonQuery.get("DefaultRange")
	minimised = jsonQuery.get("Minimised")
	requestedRange = jsonQuery.get("RequestedRange")
	Queries = jsonQuery.get("Queries")

	# print("Default Range: ", defaultRange)
	# print("Requested Range: ", requestedRange)
	
	return Queries,defaultRange,type,minimised,requestedRange
	


def _pivotData(data, pivotKey):
	"""
	Pivots the data based on the specified pivot key.
	
	Parameters:
		data (List of FluxRecord): The data to pivot.
		pivotKey (str): The key to pivot the data on.
	
	Returns:
		pd.DataFrame: A pandas DataFrame with the pivoted data.
	"""
	
	print("Pivoting Data...")
	
	if not data or not data[0].records:
		raise ValueError("No data available to pivot")
	
	# Create a list of records for DataFrame creation
	records_list = []
	
	for table in data:
		for record in table.records:
			records_list.append({
					"time": record.get_time(),
					pivotKey: record.values.get(pivotKey),
					"value": record.get_value()
					})

	df = pd.DataFrame(records_list)
	if not pivotKey:
		return df[["time","value"]] # If no pivot key is specified, return the raw data without pivoting
	
	# Pivot: rows are time, columns are axis, values are measurement values
	pivot_df = df.pivot_table(index="time", columns=pivotKey, values="value", aggfunc='first')

	# Optional: sort by time
	pivot_df.sort_index(inplace=True)
	
	return pivot_df

def _reduceData(data,limitNumber,limitType):
	"""
	Reduces a DataFrame by selecting a limited number of columns based on maximum or minimum values.

	Parameters:
		data (pd.DataFrame): The input DataFrame with numeric columns.
		limitNumber (int): The number of columns to retain based on the specified limit type.
		limitType (str): The type of reduction to apply:
			- "Max": Retain columns with the highest maximum values.
			- "Min": Retain columns with the lowest minimum values.

	Returns:
		pd.DataFrame: A reduced DataFrame containing only the selected columns.
	"""
	
	if(limitType == "Max"):
		max_data = data.max()
		top_columns = max_data.nlargest(limitNumber).index
	elif(limitType == "Min"):
		min_data = data.min()
		top_columns = min_data.nsmallest(limitNumber).index
	else:
		raise ValueError(f"Invalid limitType: {limitType}. Expected 'Max' or 'Min'.")
	reducedData = data[top_columns]
	
	return reducedData

def runJSONQuery(jsonQuery):
	"""
	Processes a JSON-formatted query request by building and executing InfluxDB queries,
	applying optional pivoting and data reduction.

	Parameters:
		jsonQuery (dict): A dictionary containing the query specification, including:
			- "Queries" (list): List of query objects with keys like "Flux", "Pivot", "Limit", and "LimitType".
			- "DefaultRange" (str): The time range to apply in query templates.
			- "Type" (str): The query type, e.g., "Stat" or "Graph".
			- "Minimised" (bool): Flag indicating whether to optimize the query for minimal display.
			
	Returns:
		list: A list of processed DataFrames (or None for queries that return no data),
			  each corresponding to one entry in the "Queries" list.
	"""
	Queries,Range,Type,minimised,requestedRange = _parseJSONQuery(jsonQuery)
	pivotedData = []
	times = []
	for i in range(len(Queries)):
		influxQuery = _buildQuery(Queries[i],Range,Type,minimised,requestedRange)
		data = _runQuery(influxQuery)
		if not data:
			print("No data returned from query")
			pivotedData.append(None)
			continue
		data = _pivotData(data, Queries[i].get("Pivot",False))
		checkLimit = Queries[i].get("Limit")
		if(checkLimit is not None):
			data = _reduceData(data,checkLimit,Queries[i].get("LimitType"))
		pivotedData.append(data)
	return pivotedData

def getInfluxData(filePath, custom_date_from=None, custom_date_to=None, timezone='Europe/London'):
	if not filePath:
		raise ValueError("File path cannot be empty or None")
	if not isinstance(filePath, str):
		raise TypeError("File path must be a string")
	if not filePath.endswith('.json'):
		raise ValueError("File path must point to a JSON file")
	
	# check if file exists
	if not os.path.exists(filePath):
		raise FileNotFoundError(f"File not found at path: {filePath}")

	with open(filePath,'r') as f:
		configFile = f.read()

	jsonQuery = json.loads(configFile)

	# inject custom date range into each query
	if custom_date_from or custom_date_to:
		print ("Injecting custom date range into queries")
		for query in jsonQuery.values():
			if isinstance(query, dict):
				query['RequestedRange'] = {
					'start': custom_date_from,
					'end': custom_date_to
				}
	#pprint.pprint(jsonQuery, indent=2, width=120)

	results = []

	# Check if SensorList exists in the JSON and capture its values
	sensor_list = []
	if 'SensorList' in jsonQuery:
		sensor_list = jsonQuery['SensorList']
	else:
		print("No SensorList found in JSON configuration")

	for i in range(1, 10):
		query_key = str(i)
		#print(query_key)
		if query_key in jsonQuery:
			start = perf_counter()
			# print(f"Running query {i}...")
			# print("Query: ",jsonQuery[str(i)])
			data = runJSONQuery(jsonQuery[str(i)])
			#serializable_data = generate_random_data(50, start_time="2025-07-28T11:15:00Z", interval_minutes=1)  # Replace with actual query function
			end = perf_counter()
			# print(f"{i} = {end-start}")
			#print("printing data : ", data)

			serializable_data = []
			if data:
				for df in data:
					if df is not None:
						# Reset index to include time as a column before converting to dictionary
						df_with_time = df.reset_index()
						#convert Dataframe to dictionary format
						df_dict = df_with_time.to_dict(orient='records')

						# Format timestamps in the data to 'HH:MM' format in GMT/BST timezone
						formatted_records = []
						for record in df_dict:
							formatted_record = {}
							for key, value in record.items():
								if key.lower() in ['time', 'timestamp', '_time'] and isinstance(value, (str, pd.Timestamp)):  # checks if key is time and if its in desired format
									formatted_record[key] = format_timestamp(value, timezone)
								else:
									formatted_record[key] = value
							formatted_records.append(formatted_record)

						serializable_data.append(formatted_records)
					else:
						serializable_data.append(None)

			# add new key to config_without_queries which exclues # the Queries key from the jsonQuery
			config_without_queries = {k: v for k, v in jsonQuery[str(i)].items() if k != "Queries"}

			#seriesExtracted = ["A-Axis_Motor", "C-Axis_Motor", "Spindle", "X-Axis_Motor_Bearing", "Y-Axis_Motor_Bearing", "Z-Axis_Motor_Bearing"]

			# Extract series names from the data
			seriesExtracted = []
			if serializable_data:
				for df_data in serializable_data:
					if df_data and len(df_data) > 0:
						# Get all columns except 'time'
						columns = [col for col in df_data[0].keys() if col != 'time']
						seriesExtracted.extend(columns)
				# Remove duplicates while preserving order
				seriesExtracted = list(dict.fromkeys(seriesExtracted))
			config_without_queries['Series'] = seriesExtracted

			results.append({
				'config': config_without_queries,
				'data': serializable_data,
				'ExecutionTime': end-start
			})
	
	results.append({
		'sensor_list': sensor_list,
	})
	#print(results)
	return results

	# dummy json
	# jsonQuery = {
	#  	"Type": "Graph",
	# 	"DefaultRange": "1h",
	# 	"Minimised": False,
	# }

# this helper function to get the timezone adjusted time in HH:MM format
def format_timestamp(timestamp, timezone='Europe/London'):
    """Convert pandas Timestamp to HH:MM format in specific timezone"""
    try:
        target_tz = pytz.timezone(timezone)  # Use pytz to get the timezone object
        
        if isinstance(timestamp, pd.Timestamp):  # handles if timestamp is a pandas Timestamp eg: Timestamp('2025-07-28 11:15:00+0000', tz='UTC')
			# Handle pandas Timestamp - ensure it's UTC first
            if timestamp.tz is None:
                utc_timestamp = timestamp.tz_localize('UTC')
            else:
                utc_timestamp = timestamp.tz_convert('UTC')
            
            # Convert to target timezone (GMT/BST automatically handled)
            local_timestamp = utc_timestamp.tz_convert(target_tz)
            return local_timestamp.strftime('%H:%M')   # Return in HH:MM format
            
        elif isinstance(timestamp, str): # handles if timestamp is a string eg: '2025-07-28T11:15:00Z'
            # Handle ISO string format
            if timestamp.endswith('Z'):
                timestamp = timestamp[:-1] + '+00:00'
            
            dt = datetime.fromisoformat(timestamp)
            
            # Ensure it's in UTC
            if dt.tzinfo is None:
                dt = pytz.UTC.localize(dt)
            else:
                dt = dt.astimezone(pytz.UTC)
            
            # Convert to target timezone
            local_dt = dt.astimezone(target_tz)
            return local_dt.strftime('%H:%M')
        else:
            return str(timestamp)
    except Exception as e:
        print(f"Error formatting timestamp {timestamp}: {e}")
        return str(timestamp)

def generate_random_data(num_records: int, start_time: str = "2025-07-28T11:15:00Z", interval_minutes: int = 1):
    data = []
    base_time = datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%SZ")

    for i in range(num_records):
        timestamp = base_time + timedelta(minutes=i * interval_minutes)
        record = {
            "time": timestamp.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "A-Axis_Motor": round(random.uniform(0.01, 0.05), 7),
            "C-Axis_Motor": round(random.uniform(0.01, 0.05), 6),
            "Spindle": round(random.uniform(0.1, 0.2), 7),
            "X-Axis_Motor_Bearing": round(random.uniform(0.01, 0.02), 13),
            "Y-Axis_Motor_Bearing": round(random.uniform(0.01, 0.02), 7),
            "Z-Axis_Motor_Bearing": round(random.uniform(-0.001, 0.001), 7),
        }
        data.append(record)

    return data

"""
if __name__ == "__main__":
	f = open("E:\\ECPMG\\workshop-viz\\backend\\config\\HurcoDashboard2.json",'r')
	configFile = f.read()
	f.close()
	jsonQuery = json.loads(configFile)
	for i in range(1,9):
		start = perf_counter()
		data = runJSONQuery(jsonQuery[str(i)])
		end = perf_counter()
		print(f"{i} = {end-start}")
	
	#print(data)
"""

""" This function is not currently in use
def _getPivotKey(data,specifiedTags):
	
	pivot_keys = [k for k in data[0].records[0].values.keys()
				if k not in ["_time", "_value", "_field", "_measurement","table","result",] and k not in specifiedTags.keys()]
	if(len(pivot_keys) ==1):
		pivotKey = pivot_keys[0]
		print("Pivot key:", pivotKey)
		return pivotKey
	print("Potential pivot keys:", pivot_keys)
	countPivotKeyOccurance = {}
	for k in pivot_keys:
		countPivotKeyOccurance[k] = set()
	for table in data:
		for record in table.records:
			for k in pivot_keys:
					tagValue = record.values.get(k)
					countPivotKeyOccurance[k].add(tagValue)
	longest_key = max(countPivotKeyOccurance, key=lambda k: len(countPivotKeyOccurance[k]))
	pivotKey = longest_key
	print("Pivot key:", pivotKey)
	return pivotKey
"""