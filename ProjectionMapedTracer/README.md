# How to run :)

(fyi this was made on a windows machine)

1. You need the latest NodeJS
2. You need to have your MIDI controller conected and allow your browser access to it

On line 120 of main.js you will see the start of the midi control add ins. if you want to drive "a" controll item with your midi controller, you need to assign teh correct MIDI chanel and MIDI CC ID to the code. EG the below MIDI chanel 1(176) CC ID 1, controls the option "colourIncrement". on your midi controller you may have it set to different MIDI chanels and different midi CCs

`````
	animationSystem.addControl("Tracer", 176, 1, "colourIncrement", 20, 3);
`````

4. Place the contents of this folder on your desktop or wherever
5. use NPN to install THREEJS with VITE
   
`````
npm install --save-dev vite
`````

5. Run VITE like this
   
`````
cd into the directory
npx vite --host
`````

6. Launch your web browser to https://localhost:8080
7. Click point a, click point b

