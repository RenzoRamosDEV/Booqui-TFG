
CREATE DATABASE user;

USE user;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    contact_phone VARCHAR(15),
    contact_email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN','CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT uk_users_contact_email UNIQUE (contact_email)
);

INSERT INTO users (first_name, last_name, date_of_birth, contact_phone, contact_email, password, role) VALUES
('Mel', 'Admin', '2003-06-15', '631835827', 'mel@booqi.com', '$2a$10$KWzCK2bFIR.1R2VChnSWWugSt8YkRLa0DBcnRo1qO9wAT1K3VCUQe', 'ADMIN'),
('Renzo', 'Admin', '2004-09-18', '623971177', 'renzo@booqi.com', '$2a$10$wFWGoGf2kZUujP8HrWdfTePotPHJJdOGTUQwhU6P0yKxIdaYyZq.m', 'ADMIN'),
('Andrea', 'Rodriguez', '2004-04-14', '678123321', 'andrea.r@gmail.com', '$2a$10$QUax2w4ZJPwEYmC.zB316uUiKIv3Zw.iIzRGqjRL6mQp8Wl06RRYO', 'CUSTOMER'),
('Joshua', 'García', '1992-03-12', '611222333', 'andres.g@email.com', '$2a$10$2zun5BkXeEiBTz147fSfOufRkwDz1PZPtGcgzBNlIGyQFjjRQMIem', 'CUSTOMER'),
('Beatriz', 'López', '1995-07-23', '622333444', 'beatriz.l@email.com', '$2a$10$tbPZhxe0A4zoY/dhNG/Ip.AJXSjBDfPJDGAvzU1N8zw4TBAlSBcJe', 'CUSTOMER'),
('Carlos', 'Martínez', '2001-11-02', '633444555', 'carlos.m@email.com', '$2a$10$SXjuJzE1t.itMBiLI6qii.u8YzRBSo3.QR.UaCc8RkMtpN6huYDsG', 'CUSTOMER');

INSERT INTO users (first_name, last_name, date_of_birth, contact_phone, contact_email, password, role) VALUES
('Diana', 'Sánchez', '1993-01-15', '644555666', 'diana.s@email.com', '$2a$10$7Hmwli475a1htPdPVolOhOASsmIKJpr571rdizeZRMqOiSUrenbGy', 'CUSTOMER'),
('Elena', 'Pérez', '1985-05-30', '655666777', 'elena.p@email.com', '$2a$10$XvEp2T8C11vHJOd7.hpkdury0EuRUEB21E4f3vCO2je51c/vuejY.', 'CUSTOMER'),
('Fernando', 'Gómez', '1997-04-10', '666777888', 'fernando.g@email.com', '$2a$10$exNGfubaXrFRqQrg.ykJy.R2rRvlyTpJ4B0h58b6jpuDjJM/BQo0u', 'CUSTOMER'),
('Gloria', 'Ruiz', '1980-12-05', '677888999', 'gloria.r@email.com', '$2a$10$1OVZrFG1o7OBVkoTUuFTte9jZs/.huoo/T7MwgYZYmjWpaCII/aVG', 'CUSTOMER'),
('Hugo', 'Torres', '2001-08-21', '688999000', 'hugo.t@email.com', '$2a$10$3yQJ9ZWlWJhLIpRWJSCPeeDYUsZEKYNuBszlSzTdi9QN2VGe3g.J.', 'CUSTOMER'),
('Isabel', 'Vidal', '1987-02-18', '699000111', 'isabel.v@email.com', '$2a$10$3H1pw7QWivh1wEjBhFkmL.iJjSdH5ZE3Nbt4gfKmb1N2W79.ksvQ6', 'CUSTOMER'),
('Jorge', 'Cano', '1991-06-25', '600111222', 'jorge.c@email.com', '$2a$10$dIfqgaqslUrxfkRXWWxt.uRTSVLdew5dsxtU7dAKUChBLQR0fmAoq', 'CUSTOMER'),
('Karla', 'Blanco', '1994-10-14', '611223344', 'karla.b@email.com', '$2a$10$hXVk2RlDfj7kaXo0vxWTCOefNSRrCsCxpqUDyjlFFh.jmzypiL5Ti', 'CUSTOMER'),
('Luis', 'Méndez', '1989-09-08', '622334455', 'luis.m@email.com', '$2a$10$BM8qalfYeosfTuN9mqmiqOfkgL6kyNKeXvZflupQGuaK2uoDQ5SJa', 'CUSTOMER'),
('Marta', 'Rivas', '1996-12-12', '633445566', 'marta.r@email.com', '$2a$10$ME798ZcSuXuNbFBtl1XaE.tJemFvdE/9Yg9XbDwG9QV94CWesVq8G', 'CUSTOMER'),
('Noé', 'Vega', '2002-03-30', '644556677', 'noe.v@email.com', '$2a$10$n3JsaYDFVRAgglNWMuuU1ucacf/SE/tBWWHKE1AvkdEwjV4/UrkZu', 'CUSTOMER');

CREATE DATABASE event;

USE event;

CREATE TABLE events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    available_tickets INT NOT NULL,
    location VARCHAR(200) NOT NULL,
    start_date DATETIME(6) NOT NULL,
    end_date DATETIME(6) NOT NULL,
    organizer VARCHAR(100) NOT NULL,
    price DOUBLE NOT NULL,
    category VARCHAR(50) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(15) NOT NULL,
    image_url VARCHAR(500),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT uk_events_contact_email UNIQUE (contact_email)
);

INSERT INTO events (title, description, available_tickets, location, start_date, end_date, organizer, price, category, contact_email, contact_phone, image_url) VALUES
('Festival de Food Trucks', 'Gastronomía sobre ruedas y música en vivo.', 15, 'Recinto Ferial, Alcorcón', '2026-05-10 12:00:00', '2026-05-10 23:00:00', 'Asociación Foodies Madrid', 45.0, 'Gastronomía', 'contacto@foodtruckfest.com', '910000001', 'https://gentleman.elperiodico.com/wp-content/uploads/2024/05/legislacion-espanola-permite-callejera-Marabilias_804829576_1898582_1020x574.webp'),
('Clases de Baile de Salón', 'Pasos básicos de salsa, bachata y tango.', 8, 'Centro Cultural, Alcorcón', '2026-04-01 18:00:00', '2026-04-01 20:00:00', 'Ritmo y Sabor', 35.0, 'Deportes', 'baile@alcorcon.es', '910000002', 'https://www.mushi-emd.com/wp-content/uploads/2019/02/clases-de-bailes-de-salon-madrid-retiro.jpg'),
('Obra de Teatro: La Espera', 'Drama contemporáneo sobre relaciones humanas.', 4, 'Teatro Gran Vía, Madrid', '2026-03-20 20:30:00', '2026-03-20 22:30:00', 'Producciones Escénicas S.L.', 40.0, 'Cultura', 'tickets@teatro.com', '910000003', 'https://www.elcorteingles.es/entradas/blog/app/uploads/2022/07/teatro.jpg'),
('Yoga al Aire Libre', 'Sesión matutina de Hatha Yoga.', 12, 'Parque Solidaridad, Fuenlabrada', '2026-06-15 09:00:00', '2026-06-15 10:30:00', 'Yoga Life', 25.0, 'Salud', 'info@yogalife.com', '910000004', 'https://tupungatovalley.com/wp-content/uploads/2023/06/mujeres-haciendo-yoga-naturaleza.jpg'),
('Concierto de Jazz Clásico', 'Cuarteto de jazz interpretando estándares.', 6, 'Club de Jazz, Embajadores', '2026-03-25 21:00:00', '2026-03-25 23:30:00', 'Jazz Club Madrid', 55.0, 'Música', 'reservas@jazzclub.com', '910000005', 'https://estaticos-cdn.prensaiberica.es/clip/e4d2ed39-fe3e-40ac-83bc-a972b9496baa_16-9-aspect-ratio_default_0.jpg'),
('Taller de Canto Moderno', 'Mejora tu técnica vocal y miedo escénico.', 5, 'Academia Música, Atocha', '2026-04-12 17:00:00', '2026-04-12 19:00:00', 'Voz Viva', 27.0, 'Educación', 'hola@vozviva.com', '910000006', 'https://www.shinemusicschool.es/wp-content/uploads/2022/09/7-1.png'),
('Conferencia Tech: AI 2026', 'Tendencias en Inteligencia Artificial.', 20, 'Auditorio Business, Gran Vía', '2026-09-10 10:00:00', '2026-09-10 18:00:00', 'Madrid Tech', 20.0, 'Tecnología', 'eventos@madridtech.com', '910000007', 'https://msftstories.thesourcemediaassets.com/sites/41/2023/03/image00016-960x640.jpeg'),
('Festival Country', 'El mejor sonido Nashville en Madrid.', 30, 'Plaza Mayor, Ciudad Lineal', '2026-07-04 19:00:00', '2026-07-04 23:59:00', 'Country Spain', 26.0, 'Música', 'info@countryspain.com', '910000008', 'https://www.shutterstock.com/image-photo/audience-huercasa-country-festival-2017-600nw-2486053773.jpg'),
('Cata de Vinos y Quesos', 'Degustación guiada con maridaje premium.', 10, 'Bodega Urbana, Chamberí', '2026-05-22 20:00:00', '2026-05-22 22:00:00', 'Sommelier Events', 30.0, 'Gastronomía', 'catas@bodega.com', '910000009', 'https://cellercanroda.cat/wp-content/uploads/2020/09/Cata-vinos-y-quesos-scaled.jpg'),
('Maratón Fotográfico', 'Captura la esencia de la ciudad.', 25, 'Puerta del Sol, Madrid', '2026-10-05 08:00:00', '2026-10-05 20:00:00', 'Foto Club Madrid', 15.0, 'Arte', 'concurso@fotoclub.com', '910000010', 'https://www.dresden-marathon.com/wp-content/uploads/2019/05/nw_181021_12_10_42-1.jpg'),
('Exposición de Arte Moderno', 'Artistas emergentes europeos.', 18, 'Galería de Arte, Malasaña', '2026-03-01 11:00:00', '2026-03-30 21:00:00', 'Art Colective', 10.0, 'Cultura', 'expo@artcolective.com', '910000011', 'https://i.blogs.es/9c240e/view_faux_rocks_2006_katharina_grosse_foto.david_diaz/500_333.jpeg'),
('Torneo Padel Solidario', 'Compite por una buena causa.', 16, 'Polideportivo, Getafe', '2026-04-18 09:00:00', '2026-04-19 18:00:00', 'Getafe Solidario', 20.0, 'Deportes', 'padel@getafe.es', '910000012', 'https://www.lta.org.uk/49614e/globalassets/padel-play/adults/padel-players-on-court-rules.jpg'),
('Curso Cocina Japonesa', 'Sushi, ramen y gyoza desde cero.', 7, 'Kitchen Lab, Chueca', '2026-02-28 10:00:00', '2026-02-28 14:00:00', 'Master Chef', 60.0, 'Gastronomía', 'cursos@kitchenlab.com', '910000013', 'https://picofinoescuelamalaga.com/wp-content/uploads/2025/09/taller-de-sushi.webp'),
('Noche de Monólogos', 'Risas con los mejores cómicos.', 9, 'Sala Comedy, La Latina', '2026-03-14 22:30:00', '2026-03-15 00:00:00', 'Risas Madrid', 18.0, 'Cultura', 'info@risasmadrid.com', '910000014', 'https://www.valenciaextra.com/uploads/s1/16/35/23/13/publico-en-un-monologo-de-gran-fira-valencia.jpeg'),
('Programación para Niños', 'Introducción a la lógica con Scratch.', 14, 'Biblioteca Retiro, Madrid', '2026-05-02 11:00:00', '2026-05-02 13:00:00', 'Future Coders', 0.0, 'Educación', 'kids@futurecoders.com', '910000015', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSReN_pJGxq3mLVTibwgRyMyhf22zLuAArPQQ&s');
INSERT INTO events (title, description, available_tickets, location, start_date, end_date, organizer, price, category, contact_email, contact_phone, image_url) VALUES
('Taller de Cerámica y Torno', 'Crea tus propias piezas de barro desde cero.', 6, 'Estudio Barro, Carabanchel', '2026-06-06 10:00:00', '2026-06-06 13:30:00', 'Artesanos de Madrid', 45.0, 'Arte', 'taller@estudiobarro.com', '910000016', 'https://estaticos-cdn.prensaiberica.es/clip/f0b182d3-1382-4217-ba5d-ec7cbdf8e891_16-9-aspect-ratio_default_0.jpg'),
('Escape Room Urbano', 'Resuelve el misterio por las calles del centro.', 22, 'Plaza de Oriente, Madrid', '2026-04-25 17:00:00', '2026-04-25 19:30:00', 'Fox in a Box', 22.0, 'Cultura', 'info@urbanescape.com', '910000017', 'https://www.escapebcn.com/images/blog/que-es-un-escape-room-exterior.jpg'),
('Introducción al Bitcoin y Web3', 'Conceptos clave sobre blockchain y finanzas.', 35, 'Coworking Space, Tetuán', '2026-07-14 19:00:00', '2026-07-14 21:00:00', 'Crypto Madrid', 12.0, 'Tecnología', 'formacion@cryptomadrid.com', '910000018', 'https://www.iebschool.com/blog/wp-content/uploads/2022/03/web3-que-es.jpg'),
('Ruta Senderismo Nocturno', 'Observación de estrellas y mitología serrana.', 15, 'Puerto de Navacerrada, Madrid', '2026-08-12 21:00:00', '2026-08-13 01:00:00', 'Madrid Aventurero', 18.5, 'Deportes', 'rutas@madridaventurero.com', '910000019', 'https://www.senderismomadrid.es/wp-content/uploads/2021/07/senderismo-nocturno-guadarrama.jpg'),
('Feria del Libro Antiguo', 'Joyas literarias, primeras ediciones y coleccionismo.', 50, 'Paseo de Recoletos, Madrid', '2026-05-01 10:00:00', '2026-05-15 21:00:00', 'Asociación de Libreros', 0.0, 'Cultura', 'contacto@librerosmadrid.es', '910000020', 'https://s1.abcstatics.com/media/madrid/2022/05/27/s/feria-libro-antiguo-kUXC--1200x630@abc.jpg'),
('Masterclass de Coctelería', 'Aprende a preparar los combinados de moda.', 12, 'Sky Bar, Gran Vía', '2026-06-20 19:30:00', '2026-06-20 21:30:00', 'Mixology Academy', 38.0, 'Gastronomía', 'reservas@mixology.com', '910000021', 'https://www.cocteleria.com.mx/wp-content/uploads/2020/02/curso-de-cocteleria-basica.jpg'),
('Torneo de Ajedrez Relámpago', 'Partidas rápidas a 5 minutos por jugador.', 40, 'Club de Ajedrez, Leganés', '2026-03-29 10:00:00', '2026-03-29 14:30:00', 'Federación Madrileña', 10.0, 'Deportes', 'torneos@ajedrezmadrid.es', '910000022', 'https://www.ajedrez21.com/img/noticias/torneo-ajedrez-rapido.jpg'),
('Charla: Mindfulness en la Era Digital', 'Herramientas para gestionar el estrés diario.', 25, 'Espacio Bienestar, Argüelles', '2026-04-09 18:30:00', '2026-04-09 20:00:00', 'Mente Sana', 15.0, 'Salud', 'hola@mentesana.com', '910000023', 'https://www.psicoactiva.com/wp-content/uploads/2021/04/mindfulness-meditacion.jpg'),
('Concierto Tributo a Queen', 'Los grandes éxitos de la banda británica en directo.', 8, 'Sala Riviera, Arganzuela', '2026-11-20 21:00:00', '2026-11-20 23:30:00', 'Rock Legends', 32.0, 'Música', 'entradas@rocklegends.com', '910000024', 'https://www.laopiniondemalaga.es/wp-content/uploads/2022/10/tributo-queen-madrid.jpg'),
('Taller de Huerto Urbano', 'Monta tu propio espacio verde en el balcón.', 15, 'Vivero Comunitario, Vallecas', '2026-05-17 11:00:00', '2026-05-17 13:00:00', 'EcoVallecas', 5.0, 'Educación', 'huertos@ecovallecas.org', '910000025', 'https://www.planteaenverde.es/blog/wp-content/uploads/2019/04/como-hacer-un-huerto-urbano.jpg');

INSERT INTO events (title, description, available_tickets, location, start_date, end_date, organizer, price, category, contact_email, contact_phone, image_url) VALUES
('Monólogos de Ciencia: Big Van', 'Divulgación científica con mucho humor.', 14, 'Teatro Cofidis, Alcobendas', '2026-06-12 20:00:00', '2026-06-12 21:30:00', 'Big Van Ciencia', 18.0, 'Cultura', 'info@bigvanciencia.com', '910000026', 'https://www.agenciasinc.es/var/ezwebin_site/storage/images/noticias/monologos-cientificos-para-reir-y-aprender/6154823-1-esl-MX/Monologos-cientificos-para-reir-y-aprender_large.jpg'),
('Taller de Batch Cooking', 'Cocina en 3 horas toda tu semana de forma saludable.', 8, 'Food Lab, San Sebastián de los Reyes', '2026-04-19 10:30:00', '2026-04-19 13:30:00', 'NutriSano', 45.0, 'Gastronomía', 'talleres@nutrisano.com', '910000027', 'https://www.cuerpomente.com/medio/2021/02/10/batch-cooking-menu-semanal_8f430589_900x900.jpg'),
('Hackathon Madrid: Green Tech', '48 horas para desarrollar soluciones ecológicas.', 50, 'Campus Google, Arganzuela', '2026-10-16 16:00:00', '2026-10-18 18:00:00', 'Green Tech Hub', 0.0, 'Tecnología', 'hack@greentech.org', '910000028', 'https://www.ituser.es/files/201911/hackathon.jpg'),
('Iniciación a la Escalada', 'Bautismo de escalada en rocódromo cubierto.', 10, 'Sputnik Climbing, Las Rozas', '2026-03-15 11:00:00', '2026-03-15 14:00:00', 'Club Alpino Madrid', 30.0, 'Deportes', 'escalada@clubalpinomadrid.es', '910000029', 'https://www.climbing.com/wp-content/uploads/2022/03/Gym-Climbing-Lead-Belay.jpg'),
('Festival de Cine Independiente', 'Proyección de cortometrajes y debate con directores.', 25, 'Cine Doré, Antón Martín', '2026-11-05 18:00:00', '2026-11-12 23:00:00', 'Filmadrid', 6.5, 'Cultura', 'prensa@filmadrid.com', '910000030', 'https://www.fotogramas.es/images/cine-independiente-festivales.jpg'),
('Taller de Finanzas Personales', 'Aprende a ahorrar e invertir de forma inteligente.', 30, 'Centro Cívico, Móstoles', '2026-05-14 19:00:00', '2026-05-14 21:00:00', 'EducaFinanzas', 15.0, 'Educación', 'contacto@educafinanzas.com', '910000031', 'https://www.bbva.com/wp-content/uploads/2021/06/bbva-finanzas-personales-ahorro-dinero.jpg'),
('Sesión de Sound Healing', 'Relajación profunda con cuencos tibetanos y gongs.', 12, 'Espacio Yoga, Salamanca', '2026-06-21 19:30:00', '2026-06-21 21:00:00', 'Anahata Sonidos', 25.0, 'Salud', 'info@anahatasonidos.com', '910000032', 'https://www.yogaenred.com/wp-content/uploads/2021/11/cuencos-tibetanos-sonoterapia.jpg'),
('Feria del Diseño y Craft', 'Mercadillo de ilustradores y diseñadores locales.', 60, 'Matadero, Madrid', '2026-09-12 11:00:00', '2026-09-13 20:00:00', 'Mercado de Diseño', 3.0, 'Arte', 'hola@mercadodediseno.es', '910000033', 'https://www.mataderomadrid.org/sites/default/files/styles/galeria_slide/public/2019-03/Mercado-Diseno-Matadero.jpg'),
('Ruta del Tapeo Histórico', 'Historia de Madrid a través de sus tabernas centenarias.', 15, 'Plaza de Cascorro, La Latina', '2026-05-30 13:00:00', '2026-05-30 16:00:00', 'Madrid Histórico Tours', 35.0, 'Gastronomía', 'guias@madridhistorico.com', '910000034', 'https://www.guiasviajar.com/wp-content/uploads/2018/02/madrid-tabernas-centenarias-latina.jpg'),
('Concierto de Indie Pop', 'Presentación del nuevo álbum de bandas emergentes.', 20, 'Sala Ochoymedio, Malasaña', '2026-04-17 21:30:00', '2026-04-18 01:00:00', 'Intromúsica', 22.5, 'Música', 'tickets@intromusica.com', '910000035', 'https://www.binaural.es/wp-content/uploads/2022/04/concierto-indie-sala-ochoymedio.jpg');

INSERT INTO events (title, description, available_tickets, location, start_date, end_date, organizer, price, category, contact_email, contact_phone, image_url) VALUES
('Bad Bunny: DeBÍ TiRAR MáS FOToS World Tour', 'El regreso del Bad Bunny a los escenarios con su gira mundial más ambiciosa.', 150, 'Estadio Riyadh Air Metropolitano, Madrid', '2026-05-30 20:00:00', '2026-05-30 23:30:00', 'Live Nation España', 73.30, 'Música', 'info@livenation.es', '911217353', 'https://www.objetivoreggaeton.com/wp-content/uploads/2025/01/bad-bunny-rinde-homenaje-a-puerto-rico-con-su-espectacular-album-debi-tirar-mas-fotos.jpg');

CREATE DATABASE booking;

USE booking;

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_first_name VARCHAR(100) NOT NULL,
    user_last_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    event_id BIGINT NOT NULL,
    event_title VARCHAR(200) NOT NULL,
    event_description TEXT,
    event_start_date DATETIME(6) NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    ticket_quantity INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE DATABASE payment;

USE payment;

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    ticket_quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100),
    error_message VARCHAR(500),
    payment_date DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

