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
        'context',
    )

admin.site.register(Word, WordAdmin)
