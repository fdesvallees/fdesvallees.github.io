targets = index.html intro/intro.html distances_angles_temps/distances_angles_temps.html lumiere_gravite/lumiere_gravite.html pollum/pollum.html

all: $(targets)

clean:
	rm $(targets)

$(targets): %.html: %.md
	pandoc -t revealjs -V theme=simple -V transition=none  -V minScale=1.0 -V maxScale=1.0 -V history=true -s  $< -o $@


