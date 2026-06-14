INSERT INTO animal_photos (animal_id, url, sort_order)
SELECT id, primary_photo_url, 0
FROM animals
WHERE primary_photo_url IS NOT NULL
  AND primary_photo_url NOT IN (SELECT url FROM animal_photos);
