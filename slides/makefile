targets = index.html intro/intro.html distances_angles_temps/distances_angles_temps.html lumiere_gravite/lumiere_gravite.html pollum/pollum.html

all: $(targets)

clean:
	rm $(targets)

$(targets): %.html: %.md
	pandoc -t revealjs -V theme=simple -V transition=none  -V width=2000 -V height=1200 \
										-V minScale=0.2 -V maxScale=2.0 -V history=true -s  -V revealjs-url=../reveal.js $< -o $@


