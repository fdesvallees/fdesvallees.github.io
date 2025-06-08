// JavaScript by Peter Hayes http://www.aphayes.pwp.blueyonder.co.uk/
// Copyright 2001-2013
// This code is made freely available but please keep this notice.
// I accept no liability for any errors in my coding but please
// let me know of any errors you find. My address is on my home page.


class Site {
  constructor (long, lat, tmz)
  {
    this.latitude = lat;
    this.longitude = long;
    this.timeZone = tmz;
  }
}


// The Julian date at observer time

function jd(obs) {
  var j = jd0(obs.year,obs.month,obs.day);
  j+=(obs.hours+((obs.minutes+obs.tz)/60.0)+(obs.seconds/3600.0))/24;
  return j;
}

// sidereal time at noon solar time for a given site, in degrees
function local_sidereal(jd, site) {
  var res=g_sidereal(jd);
  res-=site.longitude/15.0;
  while (res < 0) res+=24.0;
  while (res > 24) res-=24.0;
  return 15.0 * res;
}

// radtoaa converts ra and dec to altitude and azimuth

function radtoaa(ra,dec,jd, site) {
  var lst=local_sidereal(jd,site); // lst in degrees
  var x=cosd(lst-ra)*cosd(dec);
  var y=sind(lst-ra)*cosd(dec);
  var z=sind(dec);
  // rotate so z is the local zenith
  var xhor=x*sind(site.latitude)-z*cosd(site.latitude);
  var yhor=y;
  var zhor=x*cosd(site.latitude)+z*sind(site.latitude);
  var azimuth=-rev(atan2d(yhor,xhor)+180.0); // so 0 degrees is north
  var altitude=atan2d(zhor,Math.sqrt(xhor*xhor+yhor*yhor));
  return new Array(altitude,azimuth);
}

// aatorad converts alt and azimuth to ra and dec

function aatorad(alt,az,jd,site) {
  var lst=local_sidereal(jd, site);
  var lat=site.latitude;
  var j=sind(alt)*sind(lat)+cosd(alt)*cosd(lat)*cosd(az);
  var dec=asind(j);
  j=(sind(alt)-sind(lat)*sind(dec))/(cosd(lat)*cosd(dec));
  var s=acosd(j);
  j=sind(az);
  if (j>0) s=360-s;
  var ra=lst-s;
  return new Array(ra,dec);
}
