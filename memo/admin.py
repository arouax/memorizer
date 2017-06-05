from django.contrib import admin
from .models import Word

# Register your models here.
class WordAdmin(admin.ModelAdmin):
    list_display = (
        'wordcontent',
        'translation',
        'pos',
        'known',
        'shown',
        'hits',
        'misses',
        'context',
        'user',
    )

admin.site.register(Word, WordAdmin)
