from ultralytics import YOLO
import cv2

main_model = YOLO("motorist.pt")
sub_model = YOLO("licenciados.pt")
main_model.to('cuda')
sub_model.to('cuda')

cap = cv2.VideoCapture("sample_1.mp4")

while True:
    ret, frame = cap.read()

    if not ret:
        break

    # results = main_model.predict(frame)[0]
    # boxes = results.boxes.xyxy
    # frame = results.plot()
    # for coords in boxes:
    #     x1, y1, x2, y2 =  int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
    #     crop_image = frame[y1:y2, x1:x2]
    #     licencias = sub_model(crop_image, conf=0.7)[0]
    #     crop_image = licencias.plot(font_size=80, pil=True, line_width=10)
    #     frame[y1:y2, x1:x2] = crop_image

    cv2.imshow("frame", frame)

cap.release()
cv2.destroyAllWindows()