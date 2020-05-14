import os
import csv
import re
import pandas
import argparse
import numpy as np
import shutil

# Predefines
regex = re.compile(r'\d+')
my_dpi = 96
fixation_vel_threshold = 50 # pixels
base_path = './original_data/Dataset_stimuli/'
output_path_csv = './csv/'
output_path_image = 'images/'
header_gaze=("web_group_id", "user_id", "timestamp", "x", "y", "duration", "shot_idx") # shot_idx could be deleted
header_mouse=("web_group_id", "user_id", "timestamp", "x", "y", "type", "shot_idx") # shot_idx could be deleted
header_gaze_shots=("shot", "user_id", "timestamp", "x", "y", "duration")
header_mouse_shots=("shot", "user_id", "timestamp", "x", "y", "type")
header_web_results=("user_id", "web_id", "web_group_id", "image", "duration", "timestamp", "layer", "step", "step_end")
header_mapping=("web_group_id", "image", "layer")
header_user=("user_id")
user_ids=[]
delimiter_in=','
delimiter_out=';'
time_per_frame=200;

def get_web_group_id(filepath):
    name_parts = filepath.split("/")
    length=len(name_parts)
    naming_scheme=name_parts[length-4]+"_"+name_parts[length-2]+"_"+name_parts[length-1] # filepath ends with website/stimuli/xpath/stimulus_idx
    return naming_scheme

def getFileName(filepath):
    name_parts = filepath.split("/")
    length=len(name_parts)
    naming_scheme=name_parts[length-1] # filepath ends with website/shot/filename
    return naming_scheme

def get_layer(web_group_id):
    name_parts=web_group_id.split("_") #web_group_id shoult look like <website>_<xpath>_<stimulus_idx> (xpath looks like number_html)
    naming_scheme=name_parts[0]+"_"+name_parts[1]+"_"+name_parts[2]
    return naming_scheme

def get_mapping(filepath):
    mapping=[]
    web_group_id=get_web_group_id(filepath)
    layer=get_layer(web_group_id)
    mapping.append((web_group_id,web_group_id+".png",layer))
    return mapping

def copy_rename(src_file, dest_file):
        shutil.copy(src_file, dest_file)
        
def write_csv_file(func,filename,header,csv_paths):
    count=0
    for x in csv_paths:
        result=func(x)
        if count==0:
            count=1
            with open(filename, "w+",newline='') as out:
                csv_out=csv.writer(out, delimiter=delimiter_out)
                csv_out.writerow(header)
                for row in result:
                    csv_out.writerow(row)
        else:
            with open(filename, "a",newline='') as out:
                csv_out=csv.writer(out, delimiter=delimiter_out)
                for row in result:
                    csv_out.writerow(row)

def get_mouse_stimulusdata(filepath):
    mouse_data=[]
    web_group_id = get_web_group_id(filepath)
    # Load gaze data
    with open(filepath + '-mouse.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=delimiter_in)
        next(reader, None) # skip the headers
        for row in reader:
            # Extract values from row
            session = row[0]
            shot_idx = int(row[1]) # aka intra_idx
            timestamp = int(row[2])
            x = int(row[3])
            y = int(row[4])
            typ = row[5]
            mouse_data.append((web_group_id,session[:2],timestamp,x,y,typ,shot_idx))
    return mouse_data

def get_mouse_shotdata(filepath):
    mouse_data=[]
    filename = getFileName(filepath)
    user = filename[:2]
    # Load gaze data
    with open(filepath + '-mouse.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=delimiter_in)
        next(reader, None) # skip the headers
        for row in reader:
            # Extract values from row
            timestamp = int(row[0])
            x = int(row[1])
            y = int(row[2])
            typ = row[3]
            mouse_data.append((filename,user,timestamp,x,y,typ))
    return mouse_data

def detect_fixations(timestamps, gaze_x, gaze_y):
    fixations = ([],[],[],[]) # triple of durations (in ms), x values, and y values of fixations
    cur_fixation = (timestamps[0], [gaze_x[0]], [gaze_y[0]]) # start timestamp, gaze_x samples, and gaze_y samples
    for i in range(1,len(timestamps)):
        mean_x = np.mean(cur_fixation[1])
        mean_y = np.mean(cur_fixation[2])
        distance = np.sqrt((gaze_x[i] - mean_x)**2 + (gaze_y[i] - mean_y)**2)
        if distance > fixation_vel_threshold: # saccade faster than threshold, fixation finished
            fixations[0].append(timestamps[i] - cur_fixation[0]) # duration
            fixations[1].append(mean_x) # fixation_x
            fixations[2].append(mean_y) # fixation_y
            fixations[3].append(cur_fixation[0]) # timestamp
            cur_fixation = (timestamps[i],[gaze_x[i]],[gaze_y[i]])
        else: # fixation does continue
            cur_fixation[1].append(gaze_x[i])
            cur_fixation[2].append(gaze_y[i])
    # Integrate last fixation
    fixations[0].append(timestamps[-1] - cur_fixation[0]) # duration
    fixations[1].append(np.mean(cur_fixation[1])) # fixation_x
    fixations[2].append(np.mean(cur_fixation[2])) # fixation_y
    fixations[3].append(cur_fixation[0]) # timestamp
    # Return fixations
    return fixations

def calculate_gazes_for_stimulusfile(filepath):
    fixation_data=[]
    # Structure for gaze data: sessions -> shots -> gaze data
    gaze_data = {}
    web_group_id = get_web_group_id(filepath)
    # Load gaze data
    with open(filepath + '-gaze.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=delimiter_in)
        next(reader, None) # skip the headers
        for row in reader:
            # Extract values from row
            session = row[0]
            shot_idx = int(row[1]) # aka intra_idx
            timestamp = int(row[2])
            x = int(row[3])
            y = int(row[4])
            # Put into dictionary for plotting
            if not session in gaze_data: # create session
                gaze_data[session] = {}
            if not shot_idx in gaze_data[session]: # create shot in session
                gaze_data[session][shot_idx] = []
            gaze_data[session][shot_idx].append((timestamp, x, y)) # append gaze data including timestamp
    # Go over sessions and shots covered by the stimulus
    for session,shots in gaze_data.items(): # for each session
        for shot,gaze in shots.items(): # for each shot
            # Raw gaze data
            (timestamps, gaze_x, gaze_y) = list(map(list, zip(*gaze)))
            # Filter fixations
            (durations, fixations_x, fixations_y, fixation_timestamps) = detect_fixations(timestamps, gaze_x, gaze_y)
            for i in range(len(durations)-1):
                fixation_data.append((web_group_id,session[:2], fixation_timestamps[i], fixations_x[i], fixations_y[i], durations[i], shot)) # shot could be deleted
    return fixation_data

def calculate_gazes_for_shotfile(filepath):
    fixation_data=[]
    filename = getFileName(filepath)
    user = filename[:2]
    # Structure for gaze data: sessions -> shots -> gaze data
    gaze_data = []
    web_group_id = get_web_group_id(filepath)
    # Load gaze data
    with open(filepath + '-gaze.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=delimiter_in)
        next(reader, None) # skip the headers
        for row in reader:
            # Extract values from row
            timestamp = int(row[0])
            x = int(row[1])
            y = int(row[2])
            # Put into dictionary for plotting
            gaze_data.append((timestamp, x, y)) # append gaze data including timestamp
    # Raw gaze data
    if(len(gaze_data)>0):
        (timestamps, gaze_x, gaze_y) = list(map(list, zip(*gaze_data)))
        # Filter fixations
        (durations, fixations_x, fixations_y, fixation_timestamps) = detect_fixations(timestamps, gaze_x, gaze_y)
        for i in range(len(durations)-1):
            fixation_data.append((filename, user, fixation_timestamps[i], fixations_x[i], fixations_y[i], durations[i]))
    return fixation_data

websites=[]
with os.scandir(base_path) as entries:# find all websites
    for entry in entries:
        if entry.is_dir():
            websites.append(entry.name)
            
csv_paths=[] # all paths for gaze.csv and mouse.csv will be stored here
for website in websites: # for every website
    stimuli_dir = base_path+website + "/stimuli/" # Compose filepath
    with os.scandir(stimuli_dir) as entries: 
        for entry in entries: # for every dir
            if entry.is_dir():
                path=stimuli_dir+entry.name+"/"
                with os.scandir(path) as filelist:
                    for file in filelist: # for every file
                         if file.name.endswith('-gaze.csv'): #if it ends on -gaze
                             number=regex.search(file.name).group(0) #find the number (f.e. 0-gaze.csv)
                             csv_paths.append(path+number)

print("create gaze.csv,mouse.csv,mapping.csv")
os.makedirs(os.path.dirname(os.path.join(os.curdir,output_path_csv[2:])), exist_ok=True) #erstellt den output_path_csv ordner falls nicht schon vorhanden.
write_csv_file(calculate_gazes_for_stimulusfile,output_path_csv+"gaze.csv",header_gaze,csv_paths)
write_csv_file(get_mouse_stimulusdata,output_path_csv+"mouse.csv",header_mouse,csv_paths)
write_csv_file(get_mapping,output_path_csv+"mapping.csv",header_mapping,csv_paths)



print("create gaze_shot.csv,mouse_shot.csv")
csv_paths_shots=[] # all paths for gaze.csv and mouse.csv will be stored here
for website in websites:
    shot_dir = base_path+website + "/shots/"
    with os.scandir(shot_dir) as filelist:
        for file in filelist: # for every file
            if file.name.endswith('.png'):
                csv_paths_shots.append(os.path.splitext(shot_dir+file.name)[0]) #filepath without extension
write_csv_file(calculate_gazes_for_shotfile,output_path_csv+"gaze_shots.csv",header_gaze_shots,csv_paths_shots)
write_csv_file(get_mouse_shotdata,output_path_csv+"mouse_shots.csv",header_mouse_shots,csv_paths_shots)


print("copy stimuli images")
for x in csv_paths: #copy all images of <website>/stimuli/<xpath>/
    source=os.path.join(os.curdir , x[2:]+".png")
    destination=os.path.join(os.curdir,output_path_image+get_web_group_id(x)+".png")
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    copy_rename(source,destination)

print("copy shot images")
#copy user_shots into image/
for website in websites:
    shot_dir = base_path+website + "/shots/"
    with os.scandir(shot_dir) as filelist:
        for file in filelist: # for every file
            if file.name.endswith('.png'):
                source=os.path.join(os.curdir , shot_dir[2:]+file.name)
                destination=os.path.join(os.curdir,output_path_image+file.name)
                os.makedirs(os.path.dirname(destination), exist_ok=True)
                copy_rename(source,destination)
#copy user_shots into image/ end

print("create web_results.csv")
#create web_results
web_results_data={}
times_gaze={}
times_mouse={}
for filepath in csv_paths:
    with open(filepath + '-shots.csv') as csvfile:
        reader = csv.reader(csvfile, delimiter=delimiter_in)
        next(reader, None) # skip the headers
        for row in reader:
            # Extract values from row
            session = row[0]
            shot_idx = int(row[1]) # aka intra_idx
            frame_idx_start= int(row[2])
            frame_idx_end= int(row[3])
            # Put into dictionary for plotting
            if not session in web_results_data: # create session
                web_results_data[session] = {}
            if not shot_idx in web_results_data[session]: # create shot in session
                web_results_data[session][shot_idx] = []
            web_results_data[session][shot_idx].append((get_web_group_id(filepath),frame_idx_start,frame_idx_end)) # append gaze data including timestamp
            #web_results_data[session][shot_idx].append((get_web_group_id(filepath),frame_idx_start)) # append gaze data including timestamp
    # Go over sessions and shots covered by the stimulus
##    with open(filepath + '-gaze.csv') as csvfile:
##        reader = csv.reader(csvfile, delimiter=delimiter_in)
##        next(reader, None) # skip the headers
##        for row in reader:
##            # Extract values from row
##            session = row[0]
##            shot_idx = int(row[1]) # aka intra_idx
##            timestamp = int(row[2])
##            # Put into dictionary for plotting
##            if not session in times_gaze: # create session
##                times_gaze[session] = {}
##            if not shot_idx in times_gaze[session]: # create shot in session
##                times_gaze[session][shot_idx] = []
##            times_gaze[session][shot_idx].append(timestamp) # append gaze data including timestamp
##            # Go over sessions and shots covered by the stimulus
##    with open(filepath + '-mouse.csv') as csvfile:
##        reader = csv.reader(csvfile, delimiter=delimiter_in)
##        next(reader, None) # skip the headers
##        for row in reader:
##            # Extract values from row
##            session = row[0]
##            shot_idx = int(row[1]) # aka intra_idx
##            timestamp = int(row[2])
##            # Put into dictionary for plotting
##            if not session in times_mouse: # create session
##                times_mouse[session] = {}
##            if not shot_idx in times_mouse[session]: # create shot in session
##                times_mouse[session][shot_idx] = []
##            times_mouse[session][shot_idx].append(timestamp) # append gaze data including timestamp
# Go over sessions and shots covered by the stimulus
web_result_csv=[]
for session,shots in web_results_data.items(): # for each session
    user_id=session[:2]
    if not user_id in user_ids:
        user_ids.append(user_id)
    for shot,web_results in shots.items(): # for each shot
        # Raw gaze data
        #(web_group_ids, frame_starts, frame_ends) = list(map(list, zip(*web_results)))
        (web_group_ids, frame_starts, frame_ends) = list(map(list, zip(*web_results)))
        # Filter fixations
##        min_time="NULL"
##        max_time="NULL"
##        duration="NULL"
##        if shot in times_gaze[session]: #if gaze_time_data
##            min_time = min(times_gaze[session][shot])
##            max_time = max(times_gaze[session][shot])
##            if shot in times_mouse[session]:
##                min_time_mouse = min(times_mouse[session][shot])
##                max_time_mouse = max(times_mouse[session][shot])
##                min_time = min((min_time,min_time_mouse))
##                max_time = max((max_time,max_time_mouse))
##            duration=max_time-min_time
##        else: #if no gaze data look into mouse data
##            if shot in times_mouse[session]:
##                min_time = min(times_mouse[session][shot])
##                max_time = max(times_mouse[session][shot])
##                duration=max_time-min_time
        timestamp=frame_starts[0]*time_per_frame
        duration=(frame_ends[0]-frame_starts[0]+1)*time_per_frame
            
        web_id = web_group_ids[0].split("_")[0]
        layer = get_layer(web_group_ids[0])
        image = session + "_" + str(shot) + ".png"
        #web_result_csv.append((user_id,web_id,web_group_ids[0],image,duration,min_time,frame_starts[0],frame_ends[0]))
        #web_result_csv.append((user_id,web_id,web_group_ids[0],image,duration,min_time,frame_starts[0],layer))
        web_result_csv.append((user_id,web_id,web_group_ids[0],image,duration,timestamp,layer,frame_starts[0],frame_ends[0]))
        
os.makedirs(os.path.dirname(os.path.join(os.curdir,output_path_csv[2:])), exist_ok=True) #erstellt den output_path_csv ordner falls nicht schon vorhanden.
outputname=output_path_csv+"web_results.csv"           
with open(outputname, "w+",newline='') as out:
    csv_out=csv.writer(out, delimiter=delimiter_out)
    csv_out.writerow(header_web_results)
    for row in web_result_csv:
        csv_out.writerow(row)        
        

data=pandas.read_csv(outputname, sep=delimiter_out)# geht ueber web_result_id und sortiert
data=data.sort_values(by=['user_id','web_id', 'step'])
data.to_csv(outputname,sep=delimiter_out,index=False,mode='w+',header=True)

print("create user.csv")        
with open(output_path_csv+"user.csv", "w+",newline='') as out: #speichert alle User
    csv_out=csv.writer(out, delimiter=delimiter_out)
    csv_out.writerow(header_user.split())
    for row in user_ids:
        csv_out.writerow(row.split())
