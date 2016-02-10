TonnetzViz
==========

TonnetzViz is a web-based music visualizer that receives MIDI input and
visualizes it in real time using the [Tonnetz]
(https://en.wikipedia.org/wiki/Tonnetz). It uses the [Web MIDI API]
(https://webaudio.github.io/web-midi-api/), which is currently supported by
Chrome and Opera. It can also be controlled using the computer keyboard.

The Tonnetz is a tonal network – a diagram representing tonal space. It can
be used to visualize harmonic relationships in music. Each node in the diagram
corresponds to one of the 12 tones and is connected to 6 adjacent nodes. The
'neighbours' of each tone are related to it either by a third (major or minor),
or by a perfect fifth, depending on their relative position in the diagram.
