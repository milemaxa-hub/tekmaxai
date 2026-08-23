---
title: "Huawei bez EUV mašina tvrdi da stiže do 1.4 nm klase do 2031. Da li je to realno?"
excerpt: "Huawei je u utorak predstavio \"Tau Scaling\" — strategiju koja zaobilazi ASML-ove EUV mašine i tvrdi da će do 2031. dostići gustinu tranzistora ekvivalentnu 1.4 nm klasi. Zvuči previše dobro. Ulazimo u detalje."
category: "Tehnologije"
author: "Mile"
date: 2026-06-20
image: "/images/huawei-1-4nm.jpg"
description: "Huawei je objavio Tau Scaling — strategiju koja do 2031. navodno donosi gustinu tranzistora 1.4 nm klase bez EUV litografije. Da li je marketing ili realnost? Srpska analiza."
tags: ["Huawei", "poluvodiči", "TSMC", "Kina", "Kirin", "ASML"]
draft: false
---

Huawei je u utorak predstavio strategiju koju je nazvao Tau Scaling, a koja bi mogla da bude jedan od najsmelijih poteza u novijoj istoriji poluvodiča. Kompanija tvrdi da će do 2031. godine dostići gustinu tranzistora ekvivalentnu **1.4 nm klasi**, i to bez ijedne EUV mašine holandskog ASML-a — onoga što se do pre dve godine smatralo nezamislivim. Vredi razumeti o čemu je tačno reč, jer ako je kompanija u pravu, nešto se suštinski menja u raspodeli snaga u industriji.

## Bez EUV mašina Huawei je ostao na oko 7 nm ekvivalenta, pa mora da traži drugi put

Kineski proizvođači čipova su pod sankcijama SAD od 2019. godine, a jedna od najvažnijih posledica je ta da ne mogu da kupe EUV litografske sisteme od ASML-a. Te mašine štampaju najtanje tranzistore na svetu i upravo su one omogućile TSMC-u da napravi 3 nm i 2 nm čipove.

Huawei danas stoji negde oko ekvivalenta od 7 nm, što je postignuto agresivnim multi-patterningom, odnosno višestrukim nanošenjem paterna na starijim DUV mašinama. Taj pristup funkcioniše, ali ima fizičku granicu — i upravo na tom mestu nastupa Tau Scaling.

## Tau Scaling se ne bavi veličinom tranzistora, nego razmakom između njih

Klasičan Moore-ov zakon, koji je pokretao industriju pola veka, svodi se na jednostavnu logiku: manji tranzistor znači više tranzistora u istom prostoru, više snage i nižu cenu. Tau Scaling polazi od potpuno drugačije teze — nije presudno koliko su tranzistori mali, nego kolika je udaljenost između njih.

Argument na koji se Huawei poziva je jasan. Preko **80 odsto** energije u modernom data centru troši se na pomeranje podataka, a ne na izračunavanje, jer svaki signal prolazi kroz mrežu metalnih vodova raspoređenih u 20 i više slojeva. Svaki vod ima otpornost i kapacitivnost, pa što je put duži, obe su gore.

Ime strategije dolazi od grčkog slova tau (τ), koje označava vreme. Poruka je, dakle, jednostavna: ne optimizuj prostor, optimizuj vreme.

## Umesto horizontalnog širenja, Huawei tranzistore slaže vertikalno i savija čip

Umesto da tranzistore širi horizontalno, kako nalaže Moore-ov zakon, Huawei ih slaže vertikalno, kao spratove zgrade. Ono što je na klasičnom čipu udaljeno milimetar, na presavijenom čipu postaje udaljeno mikron.

I u tome je poenta razlike prema konkurenciji. AMD u svom 3D V-Cache rešenju, Intel u Foveros tehnologiji i TSMC u SoIC-u koriste bonding pitch od oko 9 mikrona, dok Huawei planira **1.5 do 2 mikrona** — četiri do pet puta gušće, kako kompanija računa.

| Kompanija | Bonding pitch | Proizvod |
|---|---|---|
| AMD | ~9 μm | 3D V-Cache |
| Intel | ~9 μm | Foveros Direct |
| TSMC | ~9 μm | SoIC |
| **Huawei** | **1.5–2 μm** | Kirin (u razvoju) |

## Huawei najavljuje 238 miliona tranzistora po kvadratnom milimetru već 2026.

U prezentaciji objavljenoj u utorak navodi se da će 2026. godine Kirin dual-layer varijanta imati **238 miliona tranzistora po kvadratnom milimetru**, što je 55 odsto iznad prvobitnog plana kompanije. Do 2031. godine gustina treba da dostigne 1.4 nm klasu, mada je tu reč o marketingu, a ne o veličini tranzistora — o toj razlici više u nastavku.

## Najveća prepreka je toplota, a prvi proizvod je Kirin za pametne telefone

Evo gde priča postaje komplikovana, a većina medija baš taj deo preskače. Prvi proizvod sa ovom tehnologijom nije čip za data centar, nego Kirin, procesor za pametne telefone.

Data centar može da izdvoji i milion evra za rashlađivanje, a telefon ne može. Kada se aktivni logički slojevi slažu jedan na drugi, temperatura raste, gustina snage raste, a hlađenje postaje noćna mora — pogotovo u tankom kućištu telefona.

Zato je termalna priča najvažniji deo Huawei prezentacije. Ako reše hlađenje, njihov plan razvoja postaje ozbiljna pretnja TSMC-u, a ako ne reše, cela ideja pada u vodu.

Ovo je najagresivnija objava kineske poluvodičke industrije do sada, i ne treba je olako odbaciti — Huawei ima ozbiljan inženjerski talenat, a SMIC iza njega nije mali igrač. Ipak, ono što kompanija zove 1.4 nm je marketing, i to varanje: reč je o gustini, a ne o veličini tranzistora, jer se gustina može dobiti slaganjem, dok performanse pojedinačnog tranzistora zavise od procesa, a ne od geometrije.

Ključno pitanje, dakle, nije pitch, nego hlađenje. Ako Huawei i SMIC zatvore jaz prema TSMC-u i Samsungu, raspodela snage u industriji čipova menja se zauvek, a ako ne, ostaje još jedna lepa prezentacija. Pratimo razvoj — za godinu dana znaćemo da li je Tau Scaling inženjerska revolucija ili marketinški trijumf.
