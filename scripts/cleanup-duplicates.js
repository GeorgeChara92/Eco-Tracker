const { supabaseAdmin } = require('../src/lib/supabase-admin');

async function cleanupDuplicates() {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized');
    return;
  }

  try {
    console.log('Fetching all assets...');
    const { data: assets, error } = await supabaseAdmin
      .from('assets')
      .select('*');

    if (error) {
      console.error('Error fetching assets:', error);
      return;
    }

    if (!assets) {
      console.log('No assets found');
      return;
    }

    // Group assets by their clean symbol (without suffixes)
    const groupedAssets = assets.reduce((acc, asset) => {
      const cleanSymbol = asset.symbol.replace(/[-=].*$/, '');
      if (!acc[cleanSymbol]) {
        acc[cleanSymbol] = [];
      }
      acc[cleanSymbol].push(asset);
      return acc;
    }, {});

    // Find symbols with duplicates
    const duplicates = Object.entries(groupedAssets)
      .filter(([_, assets]) => assets.length > 1)
      .map(([symbol, assets]) => ({
        symbol,
        assets: assets.map(a => ({
          id: a.id,
          symbol: a.symbol,
          name: a.name
        }))
      }));

    console.log('Found duplicates:', duplicates);

    // For each duplicate, keep the one with the Yahoo Finance format
    for (const { symbol, assets } of duplicates) {
      const yahooFormat = assets.find(a => 
        a.symbol.includes('=F') || 
        a.symbol.includes('=X') || 
        a.symbol.includes('-USD')
      );

      if (yahooFormat) {
        // Delete all other versions
        const otherIds = assets
          .filter(a => a.id !== yahooFormat.id)
          .map(a => a.id);

        if (otherIds.length > 0) {
          console.log(`Deleting duplicate entries for ${symbol}:`, otherIds);
          const { error: deleteError } = await supabaseAdmin
            .from('assets')
            .delete()
            .in('id', otherIds);

          if (deleteError) {
            console.error(`Error deleting duplicates for ${symbol}:`, deleteError);
          }
        }
      }
    }

    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
}

cleanupDuplicates(); 