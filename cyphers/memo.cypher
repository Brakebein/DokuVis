// if value doesn't exist
CASE WHEN exists(title.value) THEN title.value ELSE title.content END AS name