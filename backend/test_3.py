from ultralytics import YOLO
import cv2

main_model = YOLO("motorist.pt")
sub_model = YOLO("licenciados_2.pt")
main_model.to('cuda')
sub_model.to('cuda')

# Open video file
cap = cv2.VideoCapture("sample_2.mp4")  # Change filename accordingly

# Check if the video file opened successfully
if not cap.isOpened():
    print("Error: Could not open video.")
    exit()

# Read and display frames in a loop
while True:
    ret, frame = cap.read()  # Read frame
    if not ret:
        break  # Exit if end of video

    results = main_model.predict(frame, conf=0.7)[0]
    boxes = results.boxes.xyxy
    frame = results.plot()
    for coords in boxes:
        x1, y1, x2, y2 =  int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
        crop_image = frame[y1:y2, x1:x2]
        licencias = sub_model(crop_image)[0]
        crop_image = licencias.plot(font_size=20, pil=True, line_width=5)
        frame[y1:y2, x1:x2] = crop_image

    cv2.imshow("Video", frame)  # Show frame

    # Press 'q' to exit early
    if cv2.waitKey(25) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
